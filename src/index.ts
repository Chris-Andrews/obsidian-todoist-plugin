import { SettingsInstance, ISettings, SettingsTab } from "./settings";
import { TodoistApi } from "./api/api";
import debug from "./log";
import { App, Editor, MarkdownView, Plugin, PluginManifest } from "obsidian";
import TodoistApiTokenModal from "./modals/enterToken/enterTokenModal";
import { getCurrentPageMdLink, getCurrentPageObsidianLink, parseLineTask } from "./utils";
import CreateTaskModal from "./modals/createTask/createTaskModal";
import QueryInjector from "./queryInjector";
import { getTokenPath } from "./token";
import type { ITaskRaw } from "./api/raw_models";
import moment from "moment";

// TODO tag configurable in settings
// let settings: ISettings = null;
// SettingsInstance.subscribe((value) => (settings = value));

export default class TodoistPlugin extends Plugin {
  public options: ISettings;

  private api: TodoistApi;

  private readonly queryInjector: QueryInjector;

  constructor(app: App, pluginManifest: PluginManifest) {
    super(app, pluginManifest);

    this.options = null;
    this.api = null;

    SettingsInstance.subscribe((value) => {
      debug({
        msg: "Settings changed",
        context: value,
      });

      this.options = value;
    });

    this.queryInjector = new QueryInjector(app);
  }

  async onload() {
    this.registerMarkdownPostProcessor(
      this.queryInjector.onNewBlock.bind(this.queryInjector)
    );
    this.addSettingTab(new SettingsTab(this.app, this));

    this.addCommand({
      id: "todoist-refresh-metadata",
      name: "Refresh Metadata",
      callback: async () => {
        if (this.api != null) {
          debug("Refreshing metadata");
          const result = await this.api.fetchMetadata();

          if (result.isErr()) {
            console.error(result.unwrapErr());
          }
        }
      },
    });

    this.addCommand({
      id: "todoist-add-task",
      name: "Add Todoist task",
      callback: () => {
        new CreateTaskModal(
          this.app,
          this.api,
          window.getSelection().toString()
        );
      },
    });

    this.addCommand({
      id: "todoist-add-task-current-page",
      name: "Add Todoist task with the current page",
      callback: () => {
        const currentSelection = window.getSelection().toString();
        new CreateTaskModal(
          this.app,
          this.api,
          `${currentSelection} ${getCurrentPageMdLink(this.app)}`,
          currentSelection.length
        );
      },
    });

    this.addCommand({
      id: "todoist-export-task",
      name: "Export task to Todoist",
      editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
        let { line } = editor.getCursor();
        let lineText = editor.getLine(line);
        let parsedTask = parseLineTask(lineText);
        if (checking) {
          return parsedTask.hasTask;
        }
        if (parsedTask.hasTask) {
          let task = `[${parsedTask.task}](${getCurrentPageObsidianLink(this.app)})`;
          let callback = (task: ITaskRaw) => {
            let base = lineText.replace(/\[.\]/, "[x]").trimEnd();
            // TODO tag configurable in settings
            let tag = "#todoist-export";
            let date = moment().format("YYYY-MM-DD");
            let link = `[🔗](${task.url})`;
            let newTaskLine = [base, tag, date, link].join(' ');
            editor.setLine(line, newTaskLine);
          };
          new CreateTaskModal(
            this.app,
            this.api,
            task,
            task.length,
            callback
          );
        }
      }
    });

    const tokenPath = getTokenPath();
    try {
      const token = await this.app.vault.adapter.read(tokenPath);
      this.api = new TodoistApi(token);
    } catch (e) {
      const tokenModal = new TodoistApiTokenModal(this.app);
      await tokenModal.waitForClose;
      const token = tokenModal.token;

      if (token.length == 0) {
        alert(
          "Provided token was empty, please enter it in the settings and restart Obsidian."
        );
        return;
      }

      await this.app.vault.adapter.write(tokenPath, token);
      this.api = new TodoistApi(token);
    }

    this.queryInjector.setApi(this.api);

    const result = await this.api.fetchMetadata();

    if (result.isErr()) {
      console.error(result.unwrapErr());
    }

    await this.loadOptions();
  }

  async loadOptions(): Promise<void> {
    const options = await this.loadData();

    SettingsInstance.update((old) => {
      return {
        ...old,
        ...(options || {}),
      };
    });

    await this.saveData(this.options);
  }

  async writeOptions(changeOpts: (settings: ISettings) => void): Promise<void> {
    SettingsInstance.update((old) => {
      changeOpts(old);
      return old;
    });
    await this.saveData(this.options);
  }
}

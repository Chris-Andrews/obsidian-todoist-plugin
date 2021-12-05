import { App, Modal } from "obsidian";
import type { ITaskRaw } from "../../api/raw_models";
import type { TodoistApi } from "../../api/api";
import CreateTaskModalContent from "./CreateTaskModalContent.svelte";

export default class CreateTaskModal extends Modal {
  private readonly modalContent: CreateTaskModalContent;

  constructor(
    app: App,
    api: TodoistApi,
    initialValue: string,
    initialCursorPosition?: number,
    callback?: (task: ITaskRaw) => void
  ) {
    super(app);

    this.titleEl.innerText = "Create new Todoist task";

    // TODO need to handle callback
    this.modalContent = new CreateTaskModalContent({
      target: this.contentEl,
      props: {
        api: api,
        close: () => this.close(),
        value: initialValue,
        initialCursorPosition: initialCursorPosition,
        callback
      },
    });

    this.open();
  }

  onClose() {
    super.onClose();
    this.modalContent.$destroy();
  }
}

import type { ID, ProjectID, SectionID, LabelID } from "./models";

export const UnknownProject: IProjectRaw = {
  id: -1,
  parent_id: null,
  order: -1,
  name: "Unknown project",
};

export const UnknownSection: ISectionRaw = {
  id: -1,
  project_id: -1,
  order: -1,
  name: "Unknown section",
};

// see: https://developer.todoist.com/rest/v1/#tasks
export interface ITaskRaw {
  id: ID;
  project_id: ProjectID;
  section_id: SectionID;
  content: string;
  description: string; // may contain markdown-formatted text
  completed: boolean;
  label_ids: LabelID[];
  parent_id?: ID;
  order: number;
  priority: number;
  due?: {
    recurring: boolean;
    date: string;
    datetime?: string;
  };
  url: string;
  comment_count: number;
  assignee: number;
  assigner: number;
}

export interface IProjectRaw {
  id: ProjectID;
  parent_id?: ProjectID;
  order: number;
  name: string;
}

export interface ISectionRaw {
  id: SectionID;
  project_id: ProjectID;
  order: number;
  name: string;
}

export interface ILabelRaw {
  id: LabelID;
  name: string;
}

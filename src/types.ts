export interface ConversationExport {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  current_node: string;
  is_archived?: boolean;
  moderation_results: unknown[];
  mapping: Record<string, MessageNode>;
  plugin_ids?: string[] | null;
  conversation_template_id?: string | null;
  gizmo_id?: string | null;
  safe_urls: string[];
}

export interface MessageNode {
  id: string;
  parent?: string;
  children: string[];
  message?: MessageContent;
}

export interface MessageContent {
  id: string;
  author: {
    role: "user" | "assistant" | "system" | "tool";
    name: string | null | undefined;
    metadata: Record<string, unknown>;
  };
  create_time: number | null;
  update_time: number | null | undefined;
  content: {
    content_type: string;
    parts?: string[];
  };
  status?: string;
  end_turn: boolean | null | undefined;
  weight?: number;
  metadata: Record<string, unknown>;
  recipient?: string;
}

export interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createTime: Date;
  metadata: Record<string, unknown>;
  // Branching information
  parentId?: string;
  childrenIds?: string[];
  branchId?: string; // To group related messages in a branch
}

export interface ConversationBranch {
  id: string;
  messages: ParsedMessage[];
  startTime: Date;
  endTime: Date;
  parentBranchId?: string;
  childrenBranchIds: string[];
}

export interface MessageTree {
  id: string;
  message: ParsedMessage;
  parent?: MessageTree;
  children: MessageTree[];
  branchId: string;
}

export interface ParsedConversation {
  id: string;
  title: string | null;
  createTime: Date;
  updateTime: Date;
  // Flat array of all messages (current branch + all branches)
  messages: ParsedMessage[];
  // Tree structure for advanced branch handling
  messageTree?: MessageTree;
  // Branch information
  branches?: ConversationBranch[];
  // Original mapping for advanced use cases
  originalMapping?: Record<string, MessageNode>;
  isArchived: boolean;
  safeUrls: string[];
}

export interface ExportData {
  conversations: ParsedConversation[];
  files: string[];
  metadata: {
    user?: any;
    messageFeedback?: any;
    modelComparisons?: any;
    sharedConversations?: any;
  };
} 
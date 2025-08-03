export interface ConversationExport {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  current_node: string;
  is_archived: boolean;
  moderation_results: any[];
  mapping: Record<string, MessageNode>;
  plugin_ids: string[] | null;
  conversation_template_id: string | null;
  gizmo_id: string | null;
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
    name: string | null;
    metadata: Record<string, any>;
  };
  create_time: number;
  update_time: number | null;
  content: {
    content_type: "text" | string;
    parts: string[];
  };
  status?: string;
  end_turn: boolean | null;
  weight: number;
  metadata: Record<string, any>;
  recipient: string;
}

export interface ParsedConversation {
  id: string;
  title: string;
  createTime: Date;
  updateTime: Date;
  messages: ParsedMessage[];
  isArchived: boolean;
  safeUrls: string[];
}

export interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createTime: Date;
  metadata: Record<string, any>;
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
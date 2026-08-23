export interface LineChannelConfig {
  config_id: string;
  channel_id: string;
  channel_secret_masked: string;
  channel_access_token_masked: string;
  webhook_url: string;
  webhook_verified: boolean;
  is_active: boolean;
  bot_display_name?: string | null;
  bot_basic_id?: string | null;
  bot_picture_url?: string | null;
  updated_at?: string;
}

export type TapAreaActionType = 'message' | 'uri' | 'postback' | 'richmenuswitch';

export interface LineTapArea {
  id: string;
  label: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: {
    type: TapAreaActionType;
    text?: string;
    uri?: string;
    data?: string;
    richMenuAliasId?: string;
  };
}

export interface LineRichMenu {
  menu_id: string;
  name: string;
  image_url: string;
  chat_bar_text: string;
  tap_areas: LineTapArea[];
  is_default: boolean;
  line_rich_menu_id?: string | null;
  created_by?: string;
  created_at: string;
}

export type BroadcastTargetType = 'all_followers' | 'linked_staff_department';
export type BroadcastStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface LineBroadcast {
  broadcast_id: string;
  title: string;
  message_text: string;
  source_knowledge_id?: string | null;
  source_knowledge_title?: string | null;
  target_type: BroadcastTargetType;
  department_id?: string | null;
  department_name?: string | null;
  scheduled_at?: string | null;
  status: BroadcastStatus;
  delivered_count: number;
  created_by?: string;
  created_by_name?: string;
  sent_at?: string | null;
  created_at: string;
}

export interface LineFollower {
  follower_id: string;
  line_user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  linked_master_user_id?: string | null;
  linked_user_name?: string | null;
  linked_user_role?: string | null;
  department_name?: string | null;
  followed_at: string;
  blocked: boolean;
  last_interaction_at?: string | null;
}

export interface AccountLinkRequest {
  request_id: string;
  master_user_id: string;
  verification_code: string;
  line_user_id?: string | null;
  status: 'pending' | 'verified' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface LineOverviewStats {
  totalFollowers: number;
  newFollowersThisWeek: number;
  messagesToday: number;
  successRate: number;
  activeRichMenuCount: number;
  linkedStaffCount: number;
  channelConnected: boolean;
}

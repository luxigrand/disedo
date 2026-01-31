export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          status: 'online' | 'offline' | 'away' | 'busy'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away' | 'busy'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away' | 'busy'
          created_at?: string
        }
      }
      servers: {
        Row: {
          id: string
          name: string
          icon_url: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon_url?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon_url?: string | null
          owner_id?: string
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          server_id: string
          name: string
          type: 'text' | 'voice'
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          type?: 'text' | 'voice'
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          type?: 'text' | 'voice'
          position?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
          attachments: string[] | null
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
          attachments?: string[] | null
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          attachments?: string[] | null
        }
      }
      server_members: {
        Row: {
          id: string
          server_id: string
          user_id: string
          role_id: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          role_id?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          role_id?: string | null
          joined_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          server_id: string
          name: string
          color: string
          permissions: Json
          position: number
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          color: string
          permissions: Json
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          color?: string
          permissions?: Json
          position?: number
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
      }
      direct_messages: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      dm_messages: {
        Row: {
          id: string
          dm_id: string
          user_id: string
          content: string
          created_at: string
          attachments: string[] | null
        }
        Insert: {
          id?: string
          dm_id: string
          user_id: string
          content: string
          created_at?: string
          attachments?: string[] | null
        }
        Update: {
          id?: string
          dm_id?: string
          user_id?: string
          content?: string
          created_at?: string
          attachments?: string[] | null
        }
      }
    }
  }
}

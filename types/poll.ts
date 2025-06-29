export interface Poll {
  id: number;
  question: string;
  isActive: boolean;
  options: PollOption[];
  created_at: string;
  updated_at?: string;
}

export type PollSubmission = {
  question: string;
  options: string[];
};
export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  created_at: string;
  updated_at?: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

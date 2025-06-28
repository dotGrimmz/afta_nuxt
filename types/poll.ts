export interface Poll {
  id: string;
  question: string;
  options: string[];
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

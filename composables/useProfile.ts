export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
}
export const useProfile = () => {
  const profile = useState<Profile | null>("profile");
  const loading = useState<boolean>("profile-loading");

  const isAdmin = computed(() => profile.value?.role === "admin");
  const isUser = computed(() => profile.value?.role === "user");

  return { profile, loading, isAdmin, isUser };
};

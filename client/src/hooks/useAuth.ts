import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated: !!user,
    userId: user?.id,
  };
}
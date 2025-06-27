// hooks/use-users.ts
import { useState, useEffect, useCallback } from 'react';
import { userService, UserListParams, UserStats } from '@/services/user.service';
import { User } from '@/services/auth.service';

interface UseUsersReturn {
  users: User[];
  userStats: UserStats;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  loading: boolean;
  error: string;
  fetchUsers: (params?: UserListParams) => Promise<void>;
  deleteUser: (id: number) => Promise<void>; 
  toggleUserStatus: (id: number) => Promise<void>;
  refreshUsers: () => Promise<void>;
  clearError: () => void;
}

const initialStats: UserStats = {
  total_users: 0,
  active_users: 0,
  inactive_users: 0,
  suspended_users: 0,
  students: 0,
  counselors: 0,
  advisors: 0,
  admins: 0,
  recent_registrations: 0,
  recent_logins: 0,
};

const initialPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(initialStats);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentParams, setCurrentParams] = useState<UserListParams>({});

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const fetchUsers = useCallback(async (params: UserListParams = {}) => {
    console.log('🔄 useUsers: Fetching users with params:', params);
    setLoading(true);
    setError('');
    setCurrentParams(params);

    try {
      const response = await userService.getUsers(params);
      console.log('📥 useUsers: API response:', response);

      if (response.success && response.data) {
        console.log('✅ useUsers: Setting users data:', response.data);
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setUserStats(response.data.stats);
      } else {
        console.log('❌ useUsers: API error:', response.message);
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('💥 useUsers: Network error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      console.log('⏳ useUsers: Loading complete');
    }
  }, []);

  const deleteUser = useCallback(
    async (id: number) => {
      console.log('🗑️ useUsers: Deleting user with ID:', id);

      if (!confirm('Are you sure you want to delete this user?')) {
        console.log('❌ useUsers: User deletion cancelled');
        return;
      }

      try {
        const response = await userService.deleteUser(id);
        console.log('📥 useUsers: Delete response:', response);

        if (response.success) {
          console.log('✅ useUsers: User deleted successfully, refreshing list');
          await fetchUsers(currentParams);
        } else {
          console.log('❌ useUsers: Delete failed:', response.message);
          setError(response.message || 'Failed to delete user');
        }
      } catch (err) {
        console.error('💥 useUsers: Delete error:', err);
        setError('Network error. Please try again.');
      }
    },
    [currentParams, fetchUsers]
  );

  const toggleUserStatus = useCallback(
    async (id: number) => {
      console.log('🔄 useUsers: Toggling status for user ID:', id);

      try {
        const response = await userService.toggleUserStatus(id);
        console.log('📥 useUsers: Toggle status response:', response);

        if (response.success) {
          console.log('✅ useUsers: Status toggled successfully, refreshing list');
          await fetchUsers(currentParams);
        } else {
          console.log('❌ useUsers: Status toggle failed:', response.message);
          setError(response.message || 'Failed to update user status');
        }
      } catch (err) {
        console.error('💥 useUsers: Toggle status error:', err);
        setError('Network error. Please try again.');
      }
    },
    [currentParams, fetchUsers]
  );

  const refreshUsers = useCallback(async () => {
    console.log('🔄 useUsers: Refreshing users with current params:', currentParams);
    await fetchUsers(currentParams);
  }, [currentParams, fetchUsers]);

  // Initial load
  useEffect(() => {
    console.log('🚀 useUsers: Initial load');
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    userStats,
    pagination,
    loading,
    error,
    fetchUsers,
    deleteUser,
    toggleUserStatus,
    refreshUsers,
    clearError,
  };
}

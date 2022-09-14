import { useQuery } from '@tanstack/react-query';
import { UsersService } from '../services';

export const UserHooks = {
    useApiKey() {
        const { isLoading, error, data, isError, refetch, isFetching, isRefetching, isSuccess, status }: any = useQuery(
            ['apiKey'], () => UsersService.getApiKey(), { enabled: false },
        );
        return { isLoading, isFetching, isRefetching, isSuccess, error, data, isError, refetch, status };
    },
    useCurrentUser() {
        const { isLoading, error, data, refetch, isSuccess }: any = useQuery(
            ['currentUser'], () => UsersService.getCurrentUser(),
        );
        return { isLoading, error, data, refetch, isSuccess };
    },
    useAllUsers() {
        const { isLoading, error, data, refetch, isSuccess, isFetching }: any = useQuery(
            ['allUsers'], () => UsersService.getUsers(),
        );
        return { isLoading, error, data, refetch, isSuccess, isFetching };
    },
};
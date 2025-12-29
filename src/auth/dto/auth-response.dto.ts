export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
}


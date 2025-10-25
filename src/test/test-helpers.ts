export const signupReq = (email = "test@test.com", password = "password123") => {
  return new Request("http://localhost:3000/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const loginReq = (email = "test@test.com", password = "password123") => {
  return new Request("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const logoutReq = () => {
  return new Request("http://localhost:3000/api/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};

export const refreshReq = (refreshToken: string) => {
  return new Request("http://localhost:3000/api/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: refreshToken,
    },
  });
};

export const authReq = (accessToken: string) => {
  return new Request("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

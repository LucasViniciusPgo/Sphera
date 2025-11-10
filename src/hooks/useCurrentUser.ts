import { useState, useEffect } from "react";

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem("currentUser") || "";
  });

  const updateCurrentUser = (username: string) => {
    localStorage.setItem("currentUser", username);
    setCurrentUser(username);
  };

  return { currentUser, updateCurrentUser };
};

export const getCurrentUser = (): string => {
  return localStorage.getItem("currentUser") || "Sistema";
};

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('gyaankosh_logged_in') === 'true';
    const username = localStorage.getItem('gyaankosh_user');
    
    setIsLoggedIn(loggedIn);
    setUser(username);
    setLoading(false);

    if (!loggedIn) {
      navigate('/auth');
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('gyaankosh_logged_in');
    localStorage.removeItem('gyaankosh_user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/auth');
  }, [navigate]);

  return { isLoggedIn, user, loading, logout };
}

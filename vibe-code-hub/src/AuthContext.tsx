import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  isVIP: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isVIP, setIsVIP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAccess: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubAccess) {
        unsubAccess();
        unsubAccess = undefined;
      }

      setUser(currentUser);

      if (currentUser) {
        if (currentUser.email) {
          const q = query(collection(db, 'xaccessCodes'), where('username', '==', currentUser.email));

          unsubAccess = onSnapshot(q, (snapshot) => {
            const hasAccess = !snapshot.empty;
            setIsVIP(hasAccess);

            if (!hasAccess) {
              signOut(auth);
            }
            setLoading(false);
          }, (error) => {
            setIsVIP(false);
            signOut(auth);
            setLoading(false);
            handleFirestoreError(error, OperationType.LIST, 'xaccessCodes');
          });
        } else {
          setIsVIP(false);
          setLoading(false);
        }
      } else {
        setIsVIP(false);
        setLoading(false);
        if (unsubAccess) {
          unsubAccess();
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubAccess) {
        unsubAccess();
      }
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isVIP, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

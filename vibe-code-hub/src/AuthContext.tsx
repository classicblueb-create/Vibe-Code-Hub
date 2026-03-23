import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
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
        console.log('User is logged in:', currentUser.email);
        
        // Check for demo mode
        const isDemo = localStorage.getItem('isDemo') === 'true';
        if (isDemo) {
          console.log('Demo mode enabled, skipping VIP check');
          setIsVIP(true);
          setLoading(false);
          return;
        }

        // Check if VIP (in accessCodes)
        if (currentUser.email) {
          console.log('Querying xaccessCodes for:', currentUser.email);
          const q = query(collection(db, 'xaccessCodes'), where('username', '==', currentUser.email));
          
          // Listen to xaccessCodes to revoke access in real-time
          unsubAccess = onSnapshot(q, (snapshot) => {
            console.log('Snapshot received, empty:', snapshot.empty);
            const hasAccess = !snapshot.empty;
            setIsVIP(hasAccess);
            
            // If not VIP, sign out
            if (!hasAccess) {
              console.log('User is not VIP, signing out');
              signOut(auth);
            }
            setLoading(false);
          }, (error) => {
            console.error('Firestore error:', error);
            setIsVIP(false);
            signOut(auth);
            setLoading(false);
            handleFirestoreError(error, OperationType.LIST, 'xaccessCodes');
          });
        } else {
          console.log('User has no email');
          setLoading(false);
        }
      } else {
        console.log('User is not logged in');
        // Check for demo mode
        const isDemo = localStorage.getItem('isDemo') === 'true';
        if (isDemo) {
          console.log('Demo mode enabled, setting VIP to true');
          setIsVIP(true);
        } else {
          setIsVIP(false);
        }
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

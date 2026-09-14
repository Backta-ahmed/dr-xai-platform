import { createContext } from "react";

// Lives apart from AuthContext.jsx so that file exports only components, which
// is what React Fast Refresh requires to hot-reload it reliably.
export const AuthContext = createContext(null);

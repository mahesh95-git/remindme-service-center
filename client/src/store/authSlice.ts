import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AuthState = { token: string | null; role: string | null }

const initialState: AuthState = {
  token: localStorage.getItem('autocare-token'),
  role: localStorage.getItem('autocare-role'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; role: string }>) => {
      state.token = action.payload.token
      state.role = action.payload.role
      localStorage.setItem('autocare-token', action.payload.token)
      localStorage.setItem('autocare-role', action.payload.role)
    },
    signOut: state => {
      state.token = null
      state.role = null
      localStorage.removeItem('autocare-token')
      localStorage.removeItem('autocare-role')
    },
  },
})

export const { setCredentials, signOut } = authSlice.actions
export type { AuthState }
export default authSlice.reducer

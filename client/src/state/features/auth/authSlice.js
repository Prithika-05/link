import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {getApiErrorMessage} from '../../../api/apiError.js'
import {authService} from '../../../services/authService.js'
import {clearStoredToken, getStoredToken, saveToken,} from '../../../services/tokenStorage.js'
import {userService} from '../../../services/userService.js'

export const registerAccount = createAsyncThunk(
    'auth/registerAccount',
    async ({username, email, password}, {rejectWithValue}) => {
        try {
            await authService.register({username, email, password})
            const loginResponse = await authService.login({email, password})
            saveToken(loginResponse.token, true)
            return loginResponse
        } catch (error) {
            return rejectWithValue(
                getApiErrorMessage(error, 'Account creation failed.'),
            )
        }
    },
)

export const loginAccount = createAsyncThunk(
    'auth/loginAccount',
    async ({email, password, remember}, {rejectWithValue}) => {
        try {
            const response = await authService.login({email, password})
            saveToken(response.token, remember)
            return response
        } catch (error) {
            return rejectWithValue(getApiErrorMessage(error, 'Login failed.'))
        }
    },
)

export const restoreSession = createAsyncThunk(
    'auth/restoreSession',
    async (_, {rejectWithValue}) => {
        const token = getStoredToken()
        if (!token) return null

        try {
            const user = await userService.getCurrentUser()
            return {token, user}
        } catch (error) {
            clearStoredToken()
            return rejectWithValue(getApiErrorMessage(error, 'Session expired.'))
        }
    },
)

export const refreshCurrentUser = createAsyncThunk(
    'auth/refreshCurrentUser',
    async (_, {rejectWithValue}) => {
        try {
            return await userService.getCurrentUser()
        } catch (error) {
            return rejectWithValue(
                getApiErrorMessage(error, 'Unable to load your profile.'),
            )
        }
    },
)

export const logoutAccount = createAsyncThunk(
    'auth/logoutAccount',
    async (_, {rejectWithValue}) => {
        try {
            await authService.logout()
            return true
        } catch (error) {
            return rejectWithValue(getApiErrorMessage(error, 'Logout request failed.'))
        } finally {
            clearStoredToken()
        }
    },
)

const initialState = {
    token: getStoredToken(),
    user: null,
    status: 'idle',
    error: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError(state) {
            state.error = null
        },
        forceLogout(state) {
            state.token = null
            state.user = null
            state.status = 'idle'
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerAccount.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(registerAccount.fulfilled, (state, action) => {
                state.status = 'authenticated'
                state.token = action.payload.token
                state.user = action.payload.user
            })
            .addCase(registerAccount.rejected, (state, action) => {
                state.status = 'error'
                state.error = action.payload
            })
            .addCase(loginAccount.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(loginAccount.fulfilled, (state, action) => {
                state.status = 'authenticated'
                state.token = action.payload.token
                state.user = action.payload.user
            })
            .addCase(loginAccount.rejected, (state, action) => {
                state.status = 'error'
                state.error = action.payload
            })
            .addCase(restoreSession.pending, (state) => {
                state.status = 'restoring'
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                if (!action.payload) {
                    state.status = 'idle'
                    state.token = null
                    state.user = null
                    return
                }

                state.status = 'authenticated'
                state.token = action.payload.token
                state.user = action.payload.user
            })
            .addCase(restoreSession.rejected, (state) => {
                state.status = 'idle'
                state.token = null
                state.user = null
            })
            .addCase(refreshCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload
            })
            .addCase(logoutAccount.fulfilled, (state) => {
                state.token = null
                state.user = null
                state.status = 'idle'
                state.error = null
            })
            .addCase(logoutAccount.rejected, (state) => {
                state.token = null
                state.user = null
                state.status = 'idle'
            })
    },
})

export const {clearAuthError, forceLogout} = authSlice.actions
export default authSlice.reducer

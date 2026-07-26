import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {healthService} from '../../../services/healthService.js'

export const checkBackendHealth = createAsyncThunk(
    'system/checkBackendHealth',
    async (_, {rejectWithValue}) => {
        try {
            return await healthService.check()
        } catch {
            return rejectWithValue('Backend unavailable')
        }
    },
)

const systemSlice = createSlice({
    name: 'system',
    initialState: {
        backendStatus: 'checking',
        backendInfo: null,
        socketStatus: 'disconnected',
    },
    reducers: {
        setSocketStatus(state, action) {
            state.socketStatus = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkBackendHealth.pending, (state) => {
                state.backendStatus = 'checking'
            })
            .addCase(checkBackendHealth.fulfilled, (state, action) => {
                state.backendStatus = 'connected'
                state.backendInfo = action.payload.data
            })
            .addCase(checkBackendHealth.rejected, (state) => {
                state.backendStatus = 'offline'
                state.backendInfo = null
            })
    },
})

export const {setSocketStatus} = systemSlice.actions
export default systemSlice.reducer

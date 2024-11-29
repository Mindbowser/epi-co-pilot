import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const configSlice = createSlice({
  name: "config",
  initialState: {
    vscMachineId: window.vscMachineId,
    accountName: "",
    accountEmail: "",
  },
  reducers: {
    setVscMachineId: (state, action: PayloadAction<string>) => {
      state.vscMachineId = action.payload;
    },
    setAccount: (state, action: PayloadAction<{ accountName: string; accountEmail: string }>) => {
      state.accountName = action.payload.accountName;
      state.accountEmail = action.payload.accountEmail;
    }
  },
});

export const { setVscMachineId, setAccount} = configSlice.actions;
export default configSlice.reducer;

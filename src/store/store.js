// The Redux store is intentionally small right now.
// Keeping it isolated makes future slices easy to add without touching app bootstrap code.
import {configureStore} from "@reduxjs/toolkit";
import authReducer from "../authSlice";

export const store = configureStore({
    reducer : {
        auth : authReducer
    }
});

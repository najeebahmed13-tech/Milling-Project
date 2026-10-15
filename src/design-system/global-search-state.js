export const initialGlobalSearchState = { open: false };

export function globalSearchReducer(state, action) {
  switch (action.type) {
    case "open": return { ...state, open: true };
    case "close": return { ...state, open: false };
    case "toggle": return { ...state, open: !state.open };
    default: return state;
  }
}

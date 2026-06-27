import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import router from "./router";
import { queryClient } from "./store/store";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#18181B",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "12px",
            padding: "12px 16px",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;

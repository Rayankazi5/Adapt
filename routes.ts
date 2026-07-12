import { createBrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { CalorieTracking } from "./pages/CalorieTracking";
import { WorkoutTracking } from "./pages/WorkoutTracking";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/calories",
    Component: CalorieTracking,
  },
  {
    path: "/workouts",
    Component: WorkoutTracking,
  },
  {
    path: "/profile",
    Component: Profile,
  },
]);

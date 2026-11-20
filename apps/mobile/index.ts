import { registerRootComponent } from "expo";
import "./src/lib/appErrorReporter";
import "./src/lib/backgroundTripTracking";
import App from "./App";

registerRootComponent(App);

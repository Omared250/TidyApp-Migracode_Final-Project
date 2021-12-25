import "./index.css";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Board from "./pages/Board";
import AdminPanel from "./pages/AdminPanel";
import TasksInfo from "./pages/TasksInfo";
import NoOfRommies from "./pages/NoOfRommies";
import RoomiesInfo from "./pages/RoomiesInfo";
import ResetPassword from "./pages/ResetPassword";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { logOut } from "./auth";

function App() {
  useEffect(() => {
    logOut();
  }, []);


	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<Homepage />} />
				<Route path='/login' element={<Login />} />
				<Route path='/signup' element={<Signup />} />
				<Route path='/tasks-info' element={<TasksInfo />} />
				<Route path='/number-of-roomies' element={<NoOfRommies />} />
				<Route path='/board/:groupId' element={<Board />} />
				<Route path='/adminpanel' element={<AdminPanel />} />
				<Route path='/set_roomies' element={<RoomiesInfo />} />
				<Route path='/ResetPassword' element={<ResetPassword />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;

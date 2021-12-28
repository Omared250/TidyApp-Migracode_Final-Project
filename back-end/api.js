const secrets = require("./secrets.json");
const { Pool } = require("pg");
const { query } = require("express");
const connection = new Pool(secrets);

const api = () => {
	const login = async (req, res) => {
		const email = req.body.email;
		const password = req.body.password;

		const userQuery =
			"SELECT group_id FROM users WHERE email=$1 AND password=$2";
		const result = await connection.query(userQuery, [email, password]);
		if (result.rows.length > 0) {
			return res.status(200).json(result.rows[0]);
		} else {
			return res.status(400).send("Your email or your password is not correct");
		}
	};

	const getUsers = async (req, res) => {
		const groupId = req.params.groupId;

		try {
			const query = `select * from users where group_id=$1`;
			const result = await connection.query(query, [groupId]);
			console.log(result.rows);
			return res.status(200).send(result.rows);
		} catch (err) {
			console.log(err);
		}
	};

	const addNewUsers = async (req, res) => {
		console.log("addNewUser");
		console.log(req.body);
		try {
			const ids = [];
			for (let user in req.body.allgroupMembers) {
				let newUser = req.body.allgroupMembers[user];
				const newUserEmail = newUser.email;
				const userQuery = "SELECT * FROM users WHERE email=$1";
				const result = await connection.query(userQuery, [newUserEmail]);
				if (result.rows.length > 0) {
					return res
						.status(400)
						.send("A user with the same email already exists!");
				} else {
					const query =
						"INSERT INTO users (username, email, type_of_user, group_id, password) VALUES ($1, $2, $3, $4, $5) returning id";
					const val = [
						newUser.username,
						newUser.email,
						newUser.type_of_user,
						newUser.group_id,
						newUser.password,
					];
					console.log(val);
					const result = await connection.query(query, val);
					ids.push({ email: newUser.email, id: result.rows[0].id });
				}
			}
			return await res.status(200).json(ids);
		} catch (error) {
			console.log(error);
			return res.status(400).send("Error " + error);
		}
	};

	const deleteUser = async (req, res) => {
		const userId = req.params.userId;
		const queryUser = "delete from users where id=$1";
		const result = await connection.query(queryUser, [userId]);
		return res.status(200).send("user deleted").json(result.rows);
	};

	const getTasks = async (req, res) => {
		const groupId = req.params.groupId;
		const query = `
        select
            t.id,
            u.username,
            g.group_name,
            t.name as task_name,
            t.description,
            t.starting_date,
            t.task_completed
        from tasks t 
        inner join users u on u.id=t.user_id
        inner join tidy_group g on g.id=u.group_id where g.id=$1 `;
    
		const taskList = await connection.query(query, [groupId]);
		return await res.status(200).json(taskList.rows);
	};

	const addNewTasks = async (req, res) => {
		const tasks = req.body;

		const insertedTasks = await tasks.map(async (task) => {
			await addNewTask(task);
		});

		if (insertedTasks.every((success) => success))
			return res.status(200).json({});
		else
			return res
				.status(400)
				.send(
					"Some tasks already exist, try updating the task instead of creating a new one!"
				);
	};

	const addNewTask = async (newTask) => {
			const createTask = `insert into tasks (name, task_completed, description, starting_date, group_id, user_id) 
      values ($1, $2, $3, $4, $5, $6) returning id`;
			await connection.query(createTask, [
				newTask.name,
				newTask.task_completed,
				newTask.description,
				newTask.starting_date,
				newTask.group_id,
				newTask.user_id,
			]);
			return true;
	};

	const deleteTask = async (req, res) => {
		const taskId = req.params.taskId;
		const query = `delete from tasks where id=$1`;
		const result = await connection.query(query, [taskId]);
		return await res
			.status(200)
			.json({ message: "The Task have been deleted!" });
	};

	const updateTask = async (req, res) => {
		try {
			const taskId = req.params.taskId;
			const task = req.body;
			const query =
				"UPDATE tasks SET name=$1, task_completed=$2, description=$3, starting_date=$4, group_id=$5, user_id=$6 WHERE id=$7;";
			const result = await connection.query(query, [
				task.name,
				task.task_completed,
				task.description,
				task.starting_date,
				task.group_id,
				task.user_id,
				taskId,
			]);
			return res.status(200).send("Task updated").json(result.rows);
		} catch (e) {
			return res.status(500).send("Error");
		}
	};

	const replaceUserValues = (user, newUser) => {
		let updatedUser = {};

		for (const propertyName in user) {
			updatedUser[propertyName] = user[propertyName];
		}
		for (const propertyName in newUser) {
			updatedUser[propertyName] = newUser[propertyName];
		}

		return updatedUser;
	};

	const getUserFromDatabase = async (userId) => {
		const result = await connection.query(`select * from users where id=$1`, [
			userId,
		]);
		const dbUser = result.rows[0];
		return dbUser;
	};

	const updateUser = async (req, res) => {
		const userId = req.params.userId;
		const userBody = req.body;

		const dbUser = await getUserFromDatabase(userId);
		const user = replaceUserValues(dbUser, userBody);

		await connection.query(
			`update users set username=$1, email=$2, type_of_user=$3, group_id=$4, password=$5 where id=$6`,
			[
				user.name,
				user.email,
				user.type_of_user,
				user.group_id,
				user.password,
				userId,
			]
		);
		await res.status(202).send(`User ${userId} have been updated!`);
	};

	const addNewGroup = async (req, res) => {
		const newGroup = req.body;

		console.log("This is new group:" + newGroup.name);
		// checking if the email of the admin exists
		const emailExists = await connection.query(
			"select * from tidy_group where email=$1",
			[newGroup.email]
		);
		if (emailExists.rows.length > 0) {
			return res.status(400).send("The email already exists as admin!");
		} else {
			// if not create the group
			let currentDate = new Date();
			const createGroup = `insert into tidy_group (group_name, email, date_of_creation, frequency, group_secret, number_of_roomies) 
      values ($1, $2, $3, $4, $5, $6) returning id`;
			const result = await connection.query(createGroup, [
				newGroup.name,
				newGroup.email,
				currentDate,
				newGroup.frequency,
				newGroup.password,
				newGroup.numbers_of_roomies,
			]);
			// answering with the task id
			await res.status(200).json({ groupId: result.rows[0].id });
		}
	};

	return {
		login,
		getUsers,
		addNewUsers,
		deleteUser,
		getTasks,
		addNewTasks,
		deleteTask,
		updateTask,
		updateUser,
		addNewGroup,
	};
};

module.exports = api;

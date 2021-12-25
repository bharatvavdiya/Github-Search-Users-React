import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
const rootUrl = "https://api.github.com";
const GithubContext = React.createContext();
const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [followers, setFollowers] = useState(mockFollowers);
	const [loading, setLoading] = useState(false);
	const [requests, setRequests] = useState(0);
	const [error, setError] = useState({ show: false, msg: "" });
	const searchGithubUser = async (user) => {
		toggleError();
		setLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) => {
			console.log(err);
		});
		if (response) {
			setGithubUser(response.data);
			const { login, followers_url } = response.data;
			await Promise.allSettled([
				axios(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results;
					const status = "fulfilled";
					if (repos.status === status) {
						setRepos(repos.value.data);
					}
					if (followers.status === status) {
						setFollowers(followers.value.data);
					}
				})
				.catch((err) => {
					console.log(err);
				});
		} else {
			toggleError(true, "User not found");
		}
	};
	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;
				setRequests(remaining);
				if (remaining === 0) {
					toggleError(true, "You have reached your request limit");
				}
				checkRequests();
				setLoading(false);
			})
			.catch((err) => {
				console.log(err);
			});
	};
	function toggleError(show, msg) {
		setError({ show, msg });
	}
	useEffect(checkRequests, []);
	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				loading,
				searchGithubUser,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};
export { GithubContext, GithubProvider };

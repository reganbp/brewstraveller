import React from "react";
import Banner from "./components/banner";
import LoginForm from "./components/loginForm";
import TopNav from "./components/navbar";

const Login = () => {
  return (
    <>
      <Banner />
      <TopNav />
      <LoginForm />
    </>
  );
};

export default Login;

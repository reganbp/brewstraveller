import React, { Fragment, useState } from "react";
import { Button, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./login.module.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    event.preventDefault();
    setEmail(event.target.value);
    console.log(email);
  };

  const handlePasswordChange = (event) => {
    event.preventDefault();
    setPassword(event.target.value);
    console.log(password);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (email === "b@r" && password === "pw") {
      console.log("email is, " + email + " password is " + password);
      navigate("/");
    } else {
      console.log("keep trying");
    }
  };

  return (
    <Fragment>
      <Container fluid className="login-container">
        <Row className="justify-content-md-center">
          <Form
            style={{ width: "50%", paddingTop: "5%", textAlign: "center" }}
            onSubmit={handleSubmit}
          >
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={handleEmailChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
              />
            </Form.Group>{" "}
            <Button variant="primary" type="submit">
              Submit{" "}
            </Button>{" "}
          </Form>{" "}
        </Row>{" "}
      </Container>{" "}
    </Fragment>
  );
};

export default LoginForm;

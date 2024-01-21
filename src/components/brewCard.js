import React from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

const BrewCard = ({ title, body }) => {
  return (
    <ul style={{ display: "flex" }}>
      <Card style={{ width: "18rem", flex: "0 0 100%" }}>
        <Card.Img variant="top" />
        <Card.Body>
          <Card.Title> {title} </Card.Title>
          <Card.Text>{body}</Card.Text>
        </Card.Body>
        <Card.Footer style={{ borderTop: "white" }}>
          <Button variant="primary"> Go somewhere </Button>
        </Card.Footer>
        {}
      </Card>
    </ul>
  );
};

export default BrewCard;

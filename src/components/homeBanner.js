import React from "react";
import banner from "../images/hops-brew.jpg";
import classes from "./homeBanner.module.css";

const HomeBanner = () => {
  return (
    <>
      <header className={classes.header}>
        <h1 style={{ textAlign: "left", fontSize: "3vw", color: "oldlace" }}>
          Brews Traveller
          <span style={{ float: "right" }}>Veni, Vedi, Bibi</span>
        </h1>
      </header>
      <div className={classes["main-image"]}>
        <img src={banner} alt="table" />
        {/* <h1>Brew Traveller</h1> */}
      </div>
    </>
  );
};

export default HomeBanner;

import axios from "axios";
import React, { useEffect, useState } from "react";
import BrewCard from "./components/brewCard";
import HomeBanner from "./components/homeBanner";
import TopNav from "./components/navbar";

const baseURL = "https://jsonplaceholder.typicode.com/posts";

const Home = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get(baseURL, { params: { _limit: 12 } }).then((response) => {
      setPosts(response.data);
    });
  }, []);
  // console.log(posts.slice(0, 5));

  return (
    <>
      <HomeBanner />
      <TopNav />
      <h1> Home </h1>{" "}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-evenly",
        }}
      >
        {" "}
        {posts.map((post) => (
          // <ul key={post.id}>
          //   <BrewCard title={post.title} body={post.body} />{" "}
          // </ul>
          <BrewCard key={post.id} title={post.title} body={post.body} />
        ))}{" "}
        {/* <BrewCard title={post.title} body={post.body} />{" "} */}{" "}
      </div>{" "}
    </>
  );
};

export default Home;

import React from "react";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import Home from "./Home";

function App() {
  return (
    // <div className="App">
    //   <header className="App-header">
    //     <Banner />
    //   </header>
    // </div>
    // <Fragment>
    //   <Banner />
    //   <Login />
    // </Fragment>
    <HashRouter>
      <Routes>
        <Route exact path="/" element={<Home />} />
        {/* <Route index element={<Home />} /> */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="blogs" element={<Blogs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NoPage />} /> */}
        {/* </Route> */}
      </Routes>
    </HashRouter>
  );
}

export default App;

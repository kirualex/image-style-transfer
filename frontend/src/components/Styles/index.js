import React from "react"

import NotificationProvider from "../../lib/notifications/provider"
import SubmitStyle from "../SubmitStyle"
import StyleModels from "../StyleModels"

function Styles(props) {
  return (
    <div>
      <NotificationProvider
        path="/train"
        options={{
          autoHideDuration: null,
          anchorOrigin: {
            vertical: "top",
            horizontal: "center"
          }
        }}
      >
        <SubmitStyle path="/" />
      </NotificationProvider>
      <StyleModels /> 
    </div>
  )
}

export default Styles

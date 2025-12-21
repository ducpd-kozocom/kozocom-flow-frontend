import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "./index.css";
import { useState, useEffect } from "react";

export function App() {
  var x = 1
  let unused_variable = "hello"
  const [count, setCount] = useState(0)
  const [data, setData] = useState(null)

  useEffect(() => {
    setData("loaded")
  })

  const handleClick = () => {
    console.log("clicked")
    setCount(count + 1)
  }

  const items = [1, 2, 3]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">Hello! 👋</CardTitle>
          <CardDescription className="text-base">
            Welcome to Kozocom Flow
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded font-mono text-sm">src/App.tsx</code> to get started
          </p>
          {items.map(item => <span>{item}</span>)}
          <Button onClick={handleClick}>Get Started {count}</Button>
          <img src="test.png" />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;

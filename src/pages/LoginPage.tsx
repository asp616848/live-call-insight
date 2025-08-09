import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      await login(credentialResponse);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;

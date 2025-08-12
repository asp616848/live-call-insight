import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Navigate to dashboard if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    const success = await login(credentialResponse);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => {
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Failed to authenticate with Google. Please try again.",
            });
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from "react";
import { View, TextInput, Button, Alert, ToastAndroid } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";

const Payment = () => {
  const [name, setName] = useState("");
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const pollPaymentStatus = async (clientSecret) => {
    let paymentVerified = false;

    while (!paymentVerified) {
      try {
        const response = await fetch("http://localhost:8080/check-payment", {
          method: "POST",
          body: JSON.stringify({ clientSecret }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.status === "succeeded") {
          paymentVerified = true;
          Alert.alert("Payment Successful");
        } else if (data.status === "failed") {
          paymentVerified = true;
          Alert.alert("Payment Failed");
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error("Error checking payment status:", error);
        ToastAndroid.show("Error checking payment status", ToastAndroid.SHORT);
        break;
      }
    }
  };

  const Subscribe = async () => {
    try {
      const response = await fetch("http://localhost:8080/pay", {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return Alert.alert("Error:", data.message);
      }

      const clientSecret = data.clientSecret;

      if (!clientSecret) {
        return Alert.alert("Error: Client secret is missing");
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Your Merchant Name",
      });

      if (initError) {
        console.error("Init payment sheet error:", initError);
        return Alert.alert("Init payment sheet error:", initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          ToastAndroid.show("Payment was canceled", ToastAndroid.SHORT);
        } else {
          ToastAndroid.show(presentError.message, ToastAndroid.SHORT);
        }
      } else {
        // Poll for payment status after presenting the sheet
        pollPaymentStatus(clientSecret);
      }
    } catch (error) {
      console.error("Error during payment:", error);
      Alert.alert("Error:", error.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, width: 200, padding: 10, marginBottom: 10 }}
      />
      <Button title="Subscribe 10$" onPress={Subscribe} />
    </View>
  );
};

export default Payment;

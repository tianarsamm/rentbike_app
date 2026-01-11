import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="date" />
      <Stack.Screen name="detailbooking" />
      <Stack.Screen name="confirmbooking" />
      <Stack.Screen name="paymentmethod" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="detailpayment" />  
      <Stack.Screen name="confirmpayment" />
    </Stack>
  );
}
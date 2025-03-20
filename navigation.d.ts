import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Login: undefined; // No parameters
  Register: undefined; // No parameters
  Index: undefined; // No parameters
};

export type NavigationProps = StackNavigationProp<RootStackParamList>; 
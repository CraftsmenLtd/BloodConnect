export type BMICategory = 'Underweight' | 'Healthy' | 'Overweight' | 'Obese' | 'Severely Obese'

export const calculateBMI = (weightKg: number, heightFeet: number | string): number => {
  const heightInFeet = typeof heightFeet === 'string' ? parseFloat(heightFeet) : heightFeet
  const heightInMeters = heightInFeet * 0.3048
  const bmi = weightKg / (heightInMeters ** 2)

  return parseFloat(bmi.toFixed(2))
}

export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obese'

  return 'Severely Obese'
}
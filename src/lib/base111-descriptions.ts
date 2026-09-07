/**
 * BASE 111 Problem Descriptions & Requirements
 * 
 * Since BASE 111 problems are foundational curriculum exercises created manually
 * (and not external LeetCode problems), this module provides the full problem
 * description, requirements, input/output formats, and examples for each problem.
 */

export interface ProblemDetail {
  dayNumber: number;
  title: string;
  topic: string;
  chapter?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  explanation?: string;
  hints?: string[];
}

export const BASE_111_DESCRIPTIONS: Record<number, Partial<ProblemDetail>> = {
  1: {
    title: "Age Estimate From Days Lived",
    topic: "Programming Basics & Computational Thinking",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that takes the total number of days a person has lived as an integer input and calculates their approximate age in years, months, and remaining days. Assume 1 year = 365 days and 1 month = 30 days.",
    inputFormat: "A single integer N representing total days lived (N >= 0).",
    outputFormat: "Print the age in the format: 'X years, Y months, Z days'.",
    sampleInput: "800",
    sampleOutput: "2 years, 2 months, 10 days",
    explanation: "800 days = (800 / 365) = 2 years with 70 days remaining. 70 days = (70 / 30) = 2 months with 10 days remaining.",
    hints: ["Use integer division (/) and modulus operator (%) to extract years, months, and days."]
  },
  2: {
    title: "Swap Two Numbers Using a Temporary Variable",
    topic: "Variables",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program to accept two integer values from standard input, store them in variables 'a' and 'b', and swap their contents using a third temporary variable 'temp'. Print the values before and after swapping.",
    inputFormat: "Two space-separated integers a and b.",
    outputFormat: "Print 'Before swap: a = X, b = Y' followed on a new line by 'After swap: a = Y, b = X'.",
    sampleInput: "15 42",
    sampleOutput: "Before swap: a = 15, b = 42\nAfter swap: a = 42, b = 15",
    explanation: "Store value of 'a' into 'temp', assign 'b' to 'a', and assign 'temp' to 'b'.",
    hints: ["Temporary variable holds the value so it isn't lost during overwrite."]
  },
  3: {
    title: "Toggle a Boolean Flag",
    topic: "Variables",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that initializes a boolean variable representing a system flag (e.g., 'isActive' or 'isOnline'). Simulate an event by toggling the flag to its opposite boolean state using the logical NOT operator and display the result.",
    inputFormat: "An integer 1 (true) or 0 (false) representing the initial state.",
    outputFormat: "Print the initial state as boolean (true/false) and the toggled state on the next line.",
    sampleInput: "1",
    sampleOutput: "Initial: true\nToggled: false",
    explanation: "Using the logical NOT operator (!) flips true to false and false to true.",
    hints: ["flag = !flag flips the value."]
  },
  4: {
    title: "Final Price After Discount and Tax",
    topic: "Operators",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that takes the original price of an item, a discount percentage, and a sales tax percentage. Calculate the final payable price. Note: Discount is applied first to the original price, and tax is applied on the discounted price.",
    inputFormat: "Three numbers: originalPrice (float), discountPercent (float), taxPercent (float).",
    outputFormat: "Print the discounted price and final price rounded to two decimal places.",
    sampleInput: "1000.00 10.0 5.0",
    sampleOutput: "Discounted Price: 900.00\nFinal Price: 945.00",
    explanation: "10% off on 1000 = 900. 5% tax on 900 = 45. Final price = 945.",
    hints: ["discountAmount = originalPrice * (discount / 100)", "taxAmount = discountedPrice * (tax / 100)"]
  },
  5: {
    title: "Withdrawal Validity as a Boolean",
    topic: "Operators",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that checks whether an ATM cash withdrawal request is valid. A withdrawal is valid if and only if: (1) withdrawalAmount is greater than 0, (2) withdrawalAmount is a multiple of 100, and (3) accountBalance >= withdrawalAmount + transactionFee ($2). Output true if valid, else false.",
    inputFormat: "Two numbers: accountBalance (float), withdrawalAmount (integer).",
    outputFormat: "Print 'Transaction Valid: true' or 'Transaction Valid: false' with remaining balance if successful.",
    sampleInput: "5000 1200",
    sampleOutput: "Transaction Valid: true\nRemaining Balance: 3798.00",
    explanation: "1200 is a multiple of 100, and 5000 >= 1200 + 2 = 1202.",
    hints: ["Check (amount % 100 == 0) && (balance >= amount + 2)."]
  },
  6: {
    title: "Largest of Three Numbers (Nested If-Else)",
    topic: "Control Structures - If-Else",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that takes three distinct integers as input and determines the largest among them using nested if-else statements (do not use logical AND operators '&&' or built-in max functions).",
    inputFormat: "Three space-separated integers A, B, and C.",
    outputFormat: "Print 'The largest number is: X'.",
    sampleInput: "45 89 23",
    sampleOutput: "The largest number is: 89",
    explanation: "Compare A and B first; based on the result, compare the winner with C.",
    hints: ["if (a > b) { if (a > c) largest = a; else largest = c; } else { if (b > c) largest = b; else largest = c; }"]
  },
  7: {
    title: "Check Leap Year",
    topic: "Control Structures - If-Else",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program to determine if a given calendar year is a leap year. A year is a leap year if it is divisible by 4, except for end-of-century years (divisible by 100), which must also be divisible by 400.",
    inputFormat: "A single positive integer representing the year.",
    outputFormat: "Print '[Year] is a Leap Year' or '[Year] is not a Leap Year'.",
    sampleInput: "2024",
    sampleOutput: "2024 is a Leap Year",
    explanation: "2024 is divisible by 4 and not divisible by 100, so it is a leap year.",
    hints: ["(year % 400 == 0) || (year % 4 == 0 && year % 100 != 0)"]
  },
  8: {
    title: "Divisible by Both 3 and 5",
    topic: "Control Structures - If-Else",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that accepts an integer N and checks if it is divisible by both 3 and 5, only 3, only 5, or neither. Print an appropriate message for each case.",
    inputFormat: "A single integer N.",
    outputFormat: "Print one of: 'Divisible by both 3 and 5', 'Divisible only by 3', 'Divisible only by 5', or 'Not divisible by 3 or 5'.",
    sampleInput: "15",
    sampleOutput: "Divisible by both 3 and 5",
    explanation: "15 % 3 == 0 and 15 % 5 == 0.",
    hints: ["Use modulo operator % to test divisibility."]
  },
  9: {
    title: "BMI Category (Nested If-Else)",
    topic: "Control Structures - If-Else",
    chapter: "Programming Basics",
    difficulty: "Medium",
    description: "Write a program to calculate Body Mass Index (BMI = weight_in_kg / (height_in_meters ^ 2)) and classify it into standard WHO categories using nested conditional logic: Underweight (< 18.5), Normal weight (18.5 - 24.9), Overweight (25 - 29.9), and Obese (>= 30).",
    inputFormat: "Two float values: weight in kilograms, height in meters.",
    outputFormat: "Print BMI value rounded to 2 decimal places and the category name.",
    sampleInput: "70.0 1.75",
    sampleOutput: "BMI: 22.86\nCategory: Normal weight",
    explanation: "70 / (1.75 * 1.75) = 22.857... which falls in the Normal weight range.",
    hints: ["heightInMeters * heightInMeters is denominator."]
  },
  10: {
    title: "Validate a Calendar Date",
    topic: "Control Structures - If-Else",
    chapter: "Programming Basics",
    difficulty: "Medium",
    description: "Write a program to validate whether a given date represented by Day, Month, and Year is valid on the Gregorian calendar. Account for differing month lengths (30 vs 31 days) and leap years for February (28 vs 29 days).",
    inputFormat: "Three space-separated integers: Day, Month, Year.",
    outputFormat: "Print 'VALID DATE' or 'INVALID DATE' with reason if invalid.",
    sampleInput: "29 2 2024",
    sampleOutput: "VALID DATE",
    explanation: "2024 is a leap year, so February 29 is valid.",
    hints: ["Check month range 1-12 first, then compute max days for that month."]
  },
  11: {
    title: "Simple Calculator Using Switch Case",
    topic: "Control Structures - Switch Case",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a menu-driven program using a switch-case statement that takes two operands and an operator character ('+', '-', '*', '/', '%') and performs the requested arithmetic operation. Handle division by zero gracefully.",
    inputFormat: "Two numbers followed by a char operator (+, -, *, /, %).",
    outputFormat: "Print the expression and result: 'A [op] B = Result'.",
    sampleInput: "12 4 /",
    sampleOutput: "12 / 4 = 3",
    explanation: "Switch on operator character '/' and evaluate 12 / 4.",
    hints: ["Remember 'break' statements in switch cases."]
  },
  12: {
    title: "Month to Season Using Fall-Through",
    topic: "Control Structures - Switch Case",
    chapter: "Programming Basics",
    difficulty: "Medium",
    description: "Write a program that takes a month number (1 to 12) and prints the corresponding season using switch-case fall-through behavior (where multiple cases share the same code block): Winter (12, 1, 2), Spring (3, 4, 5), Summer (6, 7, 8), Autumn/Monsoon (9, 10, 11).",
    inputFormat: "An integer representing the month (1-12).",
    outputFormat: "Print the season name or 'Invalid Month'.",
    sampleInput: "4",
    sampleOutput: "Season: Spring",
    explanation: "Cases 3, 4, and 5 fall through to print 'Spring'.",
    hints: ["Omit break statements between cases 3, 4 to fall through to 5."]
  },
  13: {
    title: "Print 1 to N (For Loop)",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that takes a positive integer N from the user and prints all natural numbers from 1 up to N separated by a space using a for loop.",
    inputFormat: "A single positive integer N.",
    outputFormat: "Numbers from 1 to N on a single line separated by spaces.",
    sampleInput: "5",
    sampleOutput: "1 2 3 4 5",
    explanation: "Loop iterates from i = 1 to N and prints each i.",
    hints: ["for (int i = 1; i <= n; i++)"]
  },
  14: {
    title: "Print N to 1 (While Loop)",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that takes an integer N and prints all numbers from N down to 1 in reverse order using a while loop.",
    inputFormat: "A single positive integer N.",
    outputFormat: "Numbers from N down to 1 separated by spaces.",
    sampleInput: "5",
    sampleOutput: "5 4 3 2 1",
    explanation: "Initialize counter at N, loop while counter >= 1, decrement counter.",
    hints: ["while (n >= 1) { print(n); n--; }"]
  },
  15: {
    title: "Check Prime Number (Loop)",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program to determine whether a given integer N (N > 1) is a prime number or not. Optimize the loop to check divisibility only up to sqrt(N).",
    inputFormat: "A positive integer N.",
    outputFormat: "Print '[N] is a Prime Number' or '[N] is not a Prime Number'.",
    sampleInput: "29",
    sampleOutput: "29 is a Prime Number",
    explanation: "29 has no divisors other than 1 and 29.",
    hints: ["Check divisors from 2 up to i * i <= N."]
  },
  16: {
    title: "Check Palindrome Number",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program to check whether a given integer is a palindrome (reads the same backward as forward). You must reverse the integer mathematically using loops and modulo arithmetic, without converting it to a string.",
    inputFormat: "An integer N.",
    outputFormat: "Print 'Palindrome' or 'Not Palindrome'.",
    sampleInput: "12321",
    sampleOutput: "Palindrome",
    explanation: "Reversing 12321 gives 12321, which equals the original number.",
    hints: ["rev = rev * 10 + (n % 10); n = n / 10;"]
  },
  17: {
    title: "Fibonacci Series (Iterative)",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program to generate and print the first N terms of the Fibonacci sequence iteratively. The series starts with 0 and 1, and each subsequent term is the sum of the previous two terms.",
    inputFormat: "A single integer N (N >= 1).",
    outputFormat: "First N Fibonacci numbers separated by spaces.",
    sampleInput: "7",
    sampleOutput: "0 1 1 2 3 5 8",
    explanation: "0+1=1, 1+1=2, 1+2=3, 2+3=5, 3+5=8.",
    hints: ["Keep two variables for previous two numbers: a = 0, b = 1."]
  },
  18: {
    title: "Break Statement Demo",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that continuously reads integers from input in a loop and sums them up. As soon as a negative number or zero is encountered, terminate the loop immediately using the 'break' statement and output the accumulated sum.",
    inputFormat: "A sequence of space-separated integers ending with a negative integer or zero.",
    outputFormat: "Print the total sum of positive integers entered before the break.",
    sampleInput: "10 25 5 18 -1 30",
    sampleOutput: "Sum before break: 58",
    explanation: "10 + 25 + 5 + 18 = 58. Loop terminates at -1 without processing 30.",
    hints: ["if (val <= 0) break;"]
  },
  19: {
    title: "Continue Statement Demo",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that prints all integers from 1 to N, but skips all numbers that are multiples of 3 using the 'continue' statement.",
    inputFormat: "A single positive integer N.",
    outputFormat: "Numbers from 1 to N (excluding multiples of 3) separated by spaces.",
    sampleInput: "10",
    sampleOutput: "1 2 4 5 7 8 10",
    explanation: "3, 6, 9 are skipped by the continue statement.",
    hints: ["if (i % 3 == 0) continue;"]
  },
  20: {
    title: "FizzBuzz",
    topic: "Control Structures - Loops",
    chapter: "Programming Basics",
    difficulty: "Easy",
    description: "Write a program that prints numbers from 1 to N. For multiples of 3, print 'Fizz' instead of the number. For multiples of 5, print 'Buzz'. For numbers which are multiples of both 3 and 5, print 'FizzBuzz'.",
    inputFormat: "A single positive integer N.",
    outputFormat: "N lines containing either the number or the corresponding string.",
    sampleInput: "15",
    sampleOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
    explanation: "Tests combined divisibility conditions.",
    hints: ["Check (i % 15 == 0) first, or check both % 3 and % 5."]
  }
};

/**
 * Returns complete problem details, synthesizing standard requirements if a custom entry
 * hasn't been manually provided yet.
 */
export function getBase111ProblemDescription(
  dayNumber: number,
  title: string,
  topic?: string,
  chapter?: string,
  difficulty?: string
): ProblemDetail {
  const curated = BASE_111_DESCRIPTIONS[dayNumber];
  if (curated && curated.description) {
    return {
      dayNumber,
      title: curated.title || title,
      topic: curated.topic || topic || "Curriculum Fundamentals",
      chapter: curated.chapter || chapter || "Programming Basics",
      difficulty: (curated.difficulty as any) || (difficulty as any) || "Easy",
      description: curated.description,
      inputFormat: curated.inputFormat || "Standard input as specified in problem statement.",
      outputFormat: curated.outputFormat || "Print the result to standard output.",
      sampleInput: curated.sampleInput || "N/A",
      sampleOutput: curated.sampleOutput || "N/A",
      explanation: curated.explanation,
      hints: curated.hints || ["Write clean, modular code with comments explaining your approach."],
    };
  }

  // Synthesize a structured problem specification for any other BASE 111 day
  return {
    dayNumber,
    title,
    topic: topic || "Programming Fundamentals",
    chapter: chapter || "Curriculum Track",
    difficulty: (difficulty as any) || "Easy",
    description: `Write a clean, well-documented program to implement: "${title}". This problem focuses on mastering concepts in ${topic || "core algorithms and data structures"}. Design your program following best software practices, handling edge cases, and ensuring optimal time and space complexity.`,
    inputFormat: `Read standard input parameters required for ${title}.`,
    outputFormat: `Print the expected output to standard console output.`,
    sampleInput: `Refer to daily track guidelines for sample inputs.`,
    sampleOutput: `Program output matching problem requirements.`,
    explanation: `Implement the program in your preferred language (C++, Java, Python, or JavaScript), test locally, and push to GitHub or share a post on LinkedIn.`,
    hints: [
      `Carefully read the problem title: "${title}".`,
      `Focus on understanding ${topic || "the algorithm"}.`,
      `Document your logic with clear variable names and comments before submitting proof.`
    ],
  };
}

package com.learnpath.config;

import com.learnpath.entity.*;
import com.learnpath.repository.*;
import com.learnpath.service.MasteryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Configuration
public class SeedData {
    @Bean
    CommandLineRunner seedApplicationData(StudentRepository students, SubjectRepository subjects,
            ConceptRepository concepts, DependencyRepository dependencies, QuestionRepository questions,
            LessonRepository lessons, QuizSessionRepository quizSessions, QuizAttemptRepository quizAttempts,
            MasteryService masteryService) {
        return args -> seed(students, subjects, concepts, dependencies, questions, lessons, quizSessions, quizAttempts, masteryService);
    }

    @Transactional
    void seed(StudentRepository students, SubjectRepository subjects, ConceptRepository concepts,
              DependencyRepository dependencies, QuestionRepository questions, LessonRepository lessons,
              QuizSessionRepository quizSessions, QuizAttemptRepository quizAttempts, MasteryService masteryService) {
        // Ensure Admin exists
        Student admin = students.findByEmail("admin@learnpath.local").orElseGet(() ->
                students.save(new Student("System Administrator", "admin@learnpath.local", "admin", "ADMIN"))
        );
        if (!"ADMIN".equals(admin.role)) {
            admin.role = "ADMIN";
            students.save(admin);
        }

        // Ensure Demo Student exists
        Student demoStudent = students.findByEmail("student@learnpath.local").orElseGet(() ->
                students.save(new Student("Demo Student", "student@learnpath.local", "password", "STUDENT"))
        );
        if (demoStudent.role == null || !"STUDENT".equals(demoStudent.role)) {
            demoStudent.role = "STUDENT";
            students.save(demoStudent);
        }

        // Additional demo students for multi-student reporting
        students.findByEmail("priya@learnpath.local").orElseGet(() ->
                students.save(new Student("Priya Sharma", "priya@learnpath.local", "password", "STUDENT"))
        );
        students.findByEmail("rahul@learnpath.local").orElseGet(() ->
                students.save(new Student("Rahul Verma", "rahul@learnpath.local", "password", "STUDENT"))
        );

        Subject java = subjects.findAll().stream().filter(s -> "Java Programming".equals(s.name)).findFirst()
                .orElseGet(() -> subjects.saveAndFlush(new Subject("Java Programming", "Learn Java through a personalized prerequisite-aware path.")));

        // Ensure concepts exist
        Concept variables = findOrSaveConcept(concepts, java.id, "Variables", "Declare, initialize, and manage primitive and reference data in memory.", 1);
        Concept operators = findOrSaveConcept(concepts, java.id, "Operators", "Perform calculations, comparisons, and boolean logic expressions.", 2);
        Concept conditions = findOrSaveConcept(concepts, java.id, "Conditions", "Direct program execution using branches, switches, and guard clauses.", 3);
        Concept loops = findOrSaveConcept(concepts, java.id, "Loops", "Repeat computational tasks with for, while, and do-while iteration.", 4);
        Concept arrays = findOrSaveConcept(concepts, java.id, "Arrays", "Organize sequential and multidimensional collections in indexed memory.", 5);

        // Ensure dependencies exist
        if (dependencies.count() == 0) {
            dependencies.saveAll(List.of(
                    new Dependency(variables.id, operators.id),
                    new Dependency(operators.id, conditions.id),
                    new Dependency(conditions.id, loops.id),
                    new Dependency(variables.id, arrays.id),
                    new Dependency(loops.id, arrays.id)
            ));
        }

        // Dual Track Pedagogical Classes (Class 1: Primary Core & Class 2: Alternative Remedial)
        // 1A. VARIABLES - PRIMARY CORE TRACK
        upsertLesson(lessons, variables.id, "PRIMARY", "Class 1: Variables, Data Types & Memory Architecture",
            "Core Track: Foundational memory allocation, 8 primitive types, type casting, and variable scopes.",
            "### 1. The Purpose of Variables in Memory\n" +
            "In computing, a program must store and process data in RAM. A variable is an abstraction over a physical memory address — a named storage container with a specific type that tells the Java Virtual Machine (JVM) how much memory to allocate and how the bits should be interpreted.\n\n" +
            "### 2. Primitive Data Types vs Reference Types\n" +
            "Java is a statically-typed language, meaning every variable must have a declared type before compilation. Java divides data types into two distinct categories:\n\n" +
            "- **Primitive Types (Stored directly on the stack):**\n" +
            "  - **Integer types:** `byte` (8-bit, -128 to 127), `short` (16-bit, -32,768 to 32,767), `int` (32-bit, default for whole numbers), `long` (64-bit, marked with 'L', e.g. 5000000000L).\n" +
            "  - **Floating-point types:** `float` (32-bit single precision, marked with 'f'), `double` (64-bit double precision, default for decimals).\n" +
            "  - **Character type:** `char` (16-bit Unicode character, enclosed in single quotes, e.g. 'A').\n" +
            "  - **Boolean type:** `boolean` (`true` or `false`).\n\n" +
            "- **Reference Types (Stored on the heap, reference on stack):**\n" +
            "  - Objects, Arrays, and Strings. Unlike primitives, reference variables store memory pointers to objects created with `new` or string literals.\n\n" +
            "### 3. Variable Lifecycle: Declaration, Initialization, and Assignment\n" +
            "- **Declaration:** Informs the compiler about the variable's name and type (`int score;`).\n" +
            "- **Initialization:** The first time a variable is given a value (`score = 100;`).\n" +
            "- **Assignment:** Updating or changing the value at any time during execution (`score = 150;`).\n\n" +
            "### 4. Scope and Initialization Rules\n" +
            "- **Local Variables:** Declared inside methods, constructors, or code blocks. Local variables are NOT given default values by Java. Attempting to read an uninitialized local variable causes a compile-time error.\n" +
            "- **Instance Variables (Fields):** Belong to an object instance and are automatically initialized to default values (0 for numbers, false for boolean, null for references).\n\n" +
            "### 5. Type Casting & Conversion\n" +
            "- **Widening Casting (Implicit):** Converting a smaller type to a larger type without data loss (`int` to `double`). Handled automatically by Java.\n" +
            "- **Narrowing Casting (Explicit):** Converting a larger type to a smaller type (`double` to `int`). Requires explicit syntax `(int) myDouble;` and truncates decimal values.\n\n" +
            "### 6. Constants with `final`\n" +
            "When you declare a variable with the `final` keyword, its value cannot be modified once assigned (`final double TAX_RATE = 0.08;`). By convention, constants are written in uppercase with underscores.",
            "public class VariablesDemo {\n" +
            "    public static final double PI = 3.1415926535;\n\n" +
            "    public static void main(String[] args) {\n" +
            "        int userId = 4021;\n" +
            "        byte userLevel = 3;\n" +
            "        double accountBalance = 1540.75;\n" +
            "        char statusTier = 'G';\n" +
            "        boolean isAccountActive = true;\n" +
            "        String username = \"Alex Vance\";\n\n" +
            "        int roundedBalance = (int) accountBalance; // Narrowing casting: 1540\n" +
            "        double balanceInCents = roundedBalance;    // Widening casting: 1540.0\n\n" +
            "        System.out.println(\"User: \" + username + \" (ID: \" + userId + \")\");\n" +
            "        System.out.println(\"Tier: \" + statusTier + \" | Active: \" + isAccountActive);\n" +
            "        System.out.println(\"Balance: $\" + accountBalance + \" (Rounded: $\" + roundedBalance + \")\");\n" +
            "    }\n" +
            "}");

        // 1B. VARIABLES - ALTERNATIVE REMEDIAL TRACK
        upsertLesson(lessons, variables.id, "ALTERNATIVE", "Class 2: Visual Analogies, Storage Jars & Type Traps",
            "Remedial Track: Storage jar mental models, overflow gotchas, and step-by-step memory visualization.",
            "### 1. Intuitive Mental Model: Variables as Labeled Storage Jars\n" +
            "If you struggle with variable types, picture kitchen storage jars with permanent label tags:\n" +
            "- **`byte`:** A tiny spice shaker (holds numbers between -128 and 127).\n" +
            "- **`short`:** A standard coffee cup (holds up to ~32,000).\n" +
            "- **`int`:** A standard 1-liter jug (holds up to ~2.14 billion).\n" +
            "- **`long`:** A giant water barrel (holds up to 9 quintillion, requires 'L' tag at the end: `9000000000L`).\n" +
            "- **`double`:** A precision measuring cylinder with decimal tick marks (`3.14159`).\n" +
            "- **`boolean`:** A simple light switch: only ON (`true`) or OFF (`false`).\n\n" +
            "### 2. Why Casting Causes Data Spills\n" +
            "- **Widening:** Pouring a spice shaker (`byte`) into a giant barrel (`long`). It fits easily without spilling any liquid. Java does this automatically!\n" +
            "- **Narrowing:** Pouring a full 1-liter jug (`int` or `double`) into a tiny spice shaker (`byte`). Liquid overflows and spills onto the floor! Java refuses to do this unless you explicitly say: `(byte) myJug;`. The JVM chops off the excess bits, changing your number unexpectedly.\n\n" +
            "### 3. The Address Tag vs the House (Reference vs Primitive)\n" +
            "- **Primitives:** The value lives directly inside your hand (`int x = 50;` holds 50).\n" +
            "- **References (`String`, Objects):** You hold a piece of paper with an address (`0x4F12`), pointing to a mansion built in the heap. When you copy a reference variable, you are copying the paper with the address, NOT building a second house!\n\n" +
            "### 4. The Top 3 Traps Students Fall Into\n" +
            "1. **Uninitialized Local Variable:** If you declare `int score;` inside `main()` and immediately try `System.out.println(score);`, your code will fail to compile. Always initialize your jars!\n" +
            "2. **Integer Division Truncation:** `5 / 2` is `2`, NOT `2.5`! Java sees two integer jars, divides them, and throws away the decimal remainder. To fix, make one side a double: `5.0 / 2` gives `2.5`.\n" +
            "3. **Integer Overflow:** If you add 1 to `Integer.MAX_VALUE` (2,147,483,647), the odometer wraps completely around to negative `-2,147,483,648`!",
            "public class VariablesAlternativeDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        // Trap 1: Integer division truncation\n" +
            "        int badAvg = 5 / 2;         // Evaluates to 2!\n" +
            "        double goodAvg = 5.0 / 2;   // Evaluates to 2.5!\n" +
            "        System.out.println(\"Integer division: \" + badAvg + \" vs Floating division: \" + goodAvg);\n\n" +
            "        // Trap 2: Explicit narrowing overflow\n" +
            "        int bigNumber = 130;\n" +
            "        byte overflowedByte = (byte) bigNumber; // byte max is 127\n" +
            "        System.out.println(\"130 cast to byte wraps around to: \" + overflowedByte); // -126\n\n" +
            "        // Trap 3: Memory reference sharing\n" +
            "        int[] originalArray = { 10, 20, 30 };\n" +
            "        int[] sharedReference = originalArray;\n" +
            "        sharedReference[0] = 99;\n" +
            "        System.out.println(\"Original array element changed: \" + originalArray[0]); // 99!\n" +
            "    }\n" +
            "}");

        // 2A. OPERATORS - PRIMARY CORE TRACK
        upsertLesson(lessons, operators.id, "PRIMARY", "Class 1: Operators, Expressions & Precedence Rules",
            "Core Track: Arithmetic, relational, logical, bitwise operators, evaluation order and type coercion.",
            "### 1. Expressions and Operators\n" +
            "An operator is a special symbol that tells the JVM compiler to perform mathematical, relational, or logical operations on one or more operands (variables and literals). An expression is a combination of variables, operators, and method calls that evaluates to a single value.\n\n" +
            "### 2. Arithmetic Operators and Division Behavior\n" +
            "Java provides standard mathematical operations: `+`, `-`, `*`, `/`, and `%` (modulus).\n" +
            "- **Integer Division Truncation:** When dividing two integers, Java discards any fractional remainder: `7 / 2` evaluates to `3`, not `3.5`. To retain decimals, at least one operand must be a floating-point number: `7.0 / 2` evaluates to `3.5`.\n" +
            "- **Modulus `%`:** Returns the remainder of division: `14 % 4` evaluates to `2`. Modulus is commonly used to test for even/odd numbers (`n % 2 == 0`) or cyclic ranges.\n\n" +
            "### 3. Prefix vs Postfix Increment & Decrement\n" +
            "The `++` and `--` operators modify variables by 1:\n" +
            "- **Postfix (`x++`):** The current value is used in the expression FIRST, and then the variable is incremented.\n" +
            "- **Prefix (`++x`):** The variable is incremented FIRST, and the new value is then used in the expression.\n\n" +
            "### 4. Relational & Equality Operators\n" +
            "Relational operators compare primitive values and return a `boolean`:\n" +
            "- Operators: `==` (equal to), `!=` (not equal to), `<`, `>`, `<=`, `>=`.\n" +
            "- **Crucial Gotcha:** The `==` operator compares memory values. For primitives, it checks numeric equivalence. For reference objects (like `String`), `==` checks if both references point to the exact same memory address! To compare object contents, always use `.equals()`.\n\n" +
            "### 5. Logical Operators and Short-Circuit Evaluation\n" +
            "Logical operators combine boolean expressions:\n" +
            "- `&&` (Logical AND): True only if both operands are true.\n" +
            "- `||` (Logical OR): True if at least one operand is true.\n" +
            "- `!` (Logical NOT): Inverts a boolean value.\n" +
            "- **Short-Circuit Optimization:** In `expr1 && expr2`, if `expr1` is false, Java skips evaluating `expr2` because the result cannot be true. In `expr1 || expr2`, if `expr1` is true, `expr2` is skipped. This prevents NullPointerExceptions: `user != null && user.isActive()`.\n\n" +
            "### 6. Compound Assignment and Operator Precedence\n" +
            "- Compound assignment (`+=`, `-=`, `*=`, `/=`, `%=`) combines arithmetic with assignment.\n" +
            "- Precedence order: Postfix `++`/`--` > Prefix `++`/`--` > Multiplicative `*`, `/`, `%` > Additive `+`, `-` > Relational `<`, `>` > Equality `==`, `!=` > Logical `&&` > Logical `||` > Assignment `=`. Always use parentheses `()` to clarify complex expressions.",
            "public class OperatorsDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        int price = 120;\n" +
            "        int quantity = 3;\n" +
            "        double discountRate = 0.15;\n\n" +
            "        double subtotal = price * quantity;\n" +
            "        double totalDiscount = subtotal * discountRate;\n" +
            "        double finalPrice = subtotal - totalDiscount;\n\n" +
            "        int counter = 10;\n" +
            "        int a = counter++; // a gets 10, counter becomes 11\n" +
            "        int b = ++counter; // counter becomes 12, b gets 12\n\n" +
            "        boolean hasCoupon = true;\n" +
            "        boolean isVip = false;\n" +
            "        boolean qualifiesForFreeShipping = (finalPrice >= 300) || (isVip && hasCoupon);\n\n" +
            "        System.out.println(\"Final Price: $\" + finalPrice + \" | Free shipping: \" + qualifiesForFreeShipping);\n" +
            "        System.out.println(\"Postfix result a: \" + a + \" | Prefix result b: \" + b);\n" +
            "    }\n" +
            "}");

        // 2B. OPERATORS - ALTERNATIVE REMEDIAL TRACK
        upsertLesson(lessons, operators.id, "ALTERNATIVE", "Class 2: Step-by-Step Operator Evaluation, Short-Circuit Shields & Math Pitfalls",
            "Remedial Track: Operator order of operations mental models, short-circuit guard clauses, and post-increment step tracing.",
            "### 1. The Post-Increment (`x++`) vs Pre-Increment (`++x`) Mystery Solved\n" +
            "Students consistently get tested on prefix vs postfix. Here is the foolproof mental model:\n" +
            "- **`x++` (Take ticket, then step forward):** Give your CURRENT value to whatever expression is asking for it, and only AFTER that expression finishes does `x` tick up by 1.\n" +
            "- **`++x` (Step forward, then take ticket):** Increase `x` by 1 IMMEDIATELY, and hand the newly incremented value to the expression.\n\n" +
            "### 2. Short-Circuiting: The Electrical Circuit Breaker\n" +
            "Think of `&&` and `||` like electrical switches wired in series or parallel:\n" +
            "- **`A && B` (Series):** If switch A is open (false), the current stops immediately! Switch B is never even touched or tested. This is why you can safely write `text != null && text.length() > 0`. If `text` is null, the second half never executes, preventing a crash!\n" +
            "- **`A || B` (Parallel):** If switch A is closed (true), the bulb lights up immediately! Java skips evaluating switch B entirely.\n\n" +
            "### 3. Step-by-Step Expression Decomposition Table\n" +
            "When faced with an expression like `int result = 5 + 3 * 2 > 10 && 4 + 1 == 5;`:\n" +
            "1. Step 1 (Multiplication first): `3 * 2 = 6` -> `5 + 6 > 10 && 4 + 1 == 5`\n" +
            "2. Step 2 (Additions): `11 > 10 && 5 == 5`\n" +
            "3. Step 3 (Comparisons): `true && true`\n" +
            "4. Step 4 (Logical AND): `true`\n\n" +
            "### 4. Floating Point Precision Pitfall\n" +
            "Computers store decimals in binary IEEE-754 format. This means `0.1 + 0.2` in Java is actually `0.30000000000000004`! Never compare floating point numbers with `==`. Instead, check if the absolute difference is smaller than an epsilon: `Math.abs(a - b) < 0.00001`.",
            "public class OperatorsAlternativeDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        // 1. Post-increment step-by-step trace\n" +
            "        int n = 5;\n" +
            "        int calculation = n++ * 2; // uses 5 * 2 = 10, then n becomes 6\n" +
            "        System.out.println(\"calculation: \" + calculation + \", n is now: \" + n);\n\n" +
            "        // 2. Short-circuit safety shield\n" +
            "        String safeStr = null;\n" +
            "        boolean isValid = (safeStr != null) && (safeStr.length() > 0);\n" +
            "        System.out.println(\"Shield guarded against crash: \" + isValid);\n\n" +
            "        // 3. Floating point equality trap\n" +
            "        double sum = 0.1 + 0.2;\n" +
            "        System.out.println(\"0.1 + 0.2 == 0.3 is: \" + (sum == 0.3)); // false!\n" +
            "        System.out.println(\"Actual sum in memory: \" + sum);\n" +
            "    }\n" +
            "}");

        // 3A. CONDITIONS - PRIMARY CORE TRACK
        upsertLesson(lessons, conditions.id, "PRIMARY", "Class 1: Control Flow, Branching & Decision Structures",
            "Core Track: Boolean branching, if/else-if chains, nested conditions, and modern Java switch expressions.",
            "### 1. Decision-Making in Software\n" +
            "Software derives its intelligence from branching: the ability to evaluate real-time conditions and execute different execution paths. In Java, control flow statements evaluate boolean expressions to direct execution.\n\n" +
            "### 2. The `if`, `else if`, and `else` Statements\n" +
            "- `if (condition)` executes its statement block only when `condition` evaluates to `true`.\n" +
            "- `else if` allows chaining mutually exclusive checks in sequence.\n" +
            "- `else` acts as the default fallback when no preceding condition matches.\n" +
            "- **Best Practice:** Always enclose conditional bodies in curly braces `{}` even for single-line statements, preventing accidental logic errors.\n\n" +
            "### 3. Nested Conditions and Guard Clauses\n" +
            "Deeply nested `if` statements create difficult-to-maintain code. Professional developers use **Guard Clauses** (early returns or validation checks) to handle failure conditions first, keeping the primary logic clean and unindented.\n\n" +
            "### 4. The `switch` Statement & Modern Switch Expressions\n" +
            "When comparing a single variable against multiple fixed values (integers, strings, enums, characters), a `switch` is cleaner than a long `else-if` ladder.\n" +
            "- **Traditional Switch:** Uses `case value:` labels. Requires `break;` to prevent fall-through into subsequent cases.\n" +
            "- **Modern Arrow Switch (Java 14+):** Uses `case value ->` syntax. It automatically prevents fall-through, can return a value directly, and produces concise, robust code.\n\n" +
            "### 5. The Ternary Operator (`? :`)\n" +
            "For simple two-way value assignments, the ternary operator provides concise inline branching:\n" +
            "`String category = age >= 18 ? \"Adult\" : \"Minor\";`\n" +
            "Use ternary expressions for simple assignments where readability is preserved.",
            "public class ControlFlowDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        int score = 84;\n" +
            "        char grade;\n" +
            "        if (score >= 90) {\n" +
            "            grade = 'A';\n" +
            "        } else if (score >= 80) {\n" +
            "            grade = 'B';\n" +
            "        } else if (score >= 70) {\n" +
            "            grade = 'C';\n" +
            "        } else {\n" +
            "            grade = 'F';\n" +
            "        }\n\n" +
            "        String feedback = switch (grade) {\n" +
            "            case 'A' -> \"Outstanding mastery of course concepts.\";\n" +
            "            case 'B' -> \"Proficient understanding; ready for advanced topics.\";\n" +
            "            case 'C' -> \"Acceptable progress; additional practice recommended.\";\n" +
            "            default -> \"Grade not recognized or failed.\";\n" +
            "        };\n\n" +
            "        System.out.println(\"Score: \" + score + \" -> Grade: \" + grade);\n" +
            "        System.out.println(\"Feedback: \" + feedback);\n" +
            "    }\n" +
            "}");

        // 3B. CONDITIONS - ALTERNATIVE REMEDIAL TRACK
        upsertLesson(lessons, conditions.id, "ALTERNATIVE", "Class 2: Decision Trees, String Comparison Pitfalls & Flow Scenarios",
            "Remedial Track: Visual flowcharts, why .equals() is mandatory for Strings, and eliminating nested if pyramid code.",
            "### 1. Mental Model: Railroad Track Switches\n" +
            "Think of your program execution as a train traveling down a track. A conditional statement is a track switch:\n" +
            "- When an `if` condition evaluates to `true`, the switch flips LEFT and the train enters that siding.\n" +
            "- If `false`, the train continues straight down the line to test the next switch (`else if`).\n" +
            "- **The Golden Rule:** In an `if - else if - else` chain, AS SOON AS one condition is true, its block executes and ALL OTHER blocks are completely skipped! Ordering matters: always check the most restrictive condition first.\n\n" +
            "### 2. The #1 Bug in Java Beginner Programs: `==` vs `.equals()`\n" +
            "Never compare Strings or Objects with `==`:\n" +
            "- `String s1 = new String(\"pass\"); String s2 = \"pass\";`\n" +
            "- `s1 == s2` is **`false`**! `==` compares whether both variables point to the identical spot in memory.\n" +
            "- `s1.equals(s2)` is **`true`**! `.equals()` opens the box and inspects each character one-by-one.\n\n" +
            "### 3. Killing the 'Pyramid of Doom' with Guard Clauses\n" +
            "Beginners often nest 4 or 5 `if` blocks inside each other, creating hard-to-read arrow shapes. The professional technique is the **Guard Clause**:\n" +
            "- Invert the condition and reject invalid state early.\n" +
            "- `if (score < 0 || score > 100) return \"Invalid\";`\n" +
            "- The rest of your code can now assume valid input without indentation!\n\n" +
            "### 4. Switch Fall-Through Trap\n" +
            "In traditional `switch`, forgetting the `break;` statement causes code to 'fall through' and execute every single case below it until a break or the end of the switch block is reached! Prefer modern arrow syntax (`case 'A' -> ...`).",
            "public class ConditionsAlternativeDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        // Trap 1: String comparison\n" +
            "        String input = new String(\"hello\");\n" +
            "        String constant = \"hello\";\n" +
            "        System.out.println(\"== check (compares memory address): \" + (input == constant)); // false\n" +
            "        System.out.println(\".equals check (compares letters): \" + input.equals(constant)); // true\n\n" +
            "        // Guard clause pattern demo\n" +
            "        int testScore = 72;\n" +
            "        boolean passed = checkEligibility(testScore);\n" +
            "        System.out.println(\"Score \" + testScore + \" eligibility: \" + (passed ? \"READY\" : \"NEEDS RETEST\"));\n" +
            "    }\n\n" +
            "    static boolean checkEligibility(int score) {\n" +
            "        if (score < 0 || score > 100) return false; // Guard 1\n" +
            "        if (score < 75) return false;               // Guard 2: 75% required\n" +
            "        return true; // Clean happy path\n" +
            "    }\n" +
            "}");

        // 4A. LOOPS - PRIMARY CORE TRACK
        upsertLesson(lessons, loops.id, "PRIMARY", "Class 1: Loops, Iteration Mechanics & Repetition Control",
            "Core Track: For, while, do-while iteration, loop invariant conditions, break and continue mechanics.",
            "### 1. The Anatomy of a Loop\n" +
            "Loops execute a block of code repeatedly while a specified boolean condition remains true. Every well-designed loop consists of four elements:\n" +
            "1. **Initialization:** Setting up an initial loop counter or state variable.\n" +
            "2. **Termination Condition:** Evaluated before (or after) each cycle to decide whether to continue.\n" +
            "3. **Loop Body:** The executable statements performed on each iteration.\n" +
            "4. **Update / Step:** Modifying the counter toward the termination condition to prevent infinite loops.\n\n" +
            "### 2. Comparing Java's Loop Types\n" +
            "- **Standard `for` Loop:** Ideal when the number of iterations is known upfront (e.g. counting from 0 to N).\n" +
            "  `for (int i = 0; i < limit; i++) { ... }`\n" +
            "- **The `while` Loop:** A pre-test loop that checks the condition BEFORE executing the body. If the condition starts false, the loop body runs zero times. Best when termination depends on dynamic runtime events.\n" +
            "- **The `do-while` Loop:** A post-test loop that executes the body FIRST, then evaluates the condition. Guaranteed to run at least once. Ideal for user input prompts and retry workflows.\n" +
            "- **The Enhanced `for-each` Loop:** Clean syntax for traversing arrays and collections without managing index pointers: `for (int item : items) { ... }`\n\n" +
            "### 3. Loop Control Statements: `break` and `continue`\n" +
            "- `break;` immediately terminates the loop and resumes execution after the closing brace.\n" +
            "- `continue;` halts the current iteration immediately and advances to the next iteration step.\n\n" +
            "### 4. Preventing Infinite Loops and Off-by-One Errors\n" +
            "The most common loop bug is the **off-by-one error**, often caused by confusing `<` with `<=` when traversing zero-indexed structures. Always ensure that the loop counter consistently progresses toward making the loop condition false.",
            "public class LoopsDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        int sum = 0;\n" +
            "        for (int i = 1; i <= 5; i++) {\n" +
            "            sum += i; // 1 + 2 + 3 + 4 + 5 = 15\n" +
            "        }\n" +
            "        System.out.println(\"Sum of 1 to 5: \" + sum);\n\n" +
            "        int countdown = 3;\n" +
            "        while (countdown > 0) {\n" +
            "            System.out.println(\"T-minus: \" + countdown);\n" +
            "            countdown--;\n" +
            "        }\n" +
            "        System.out.println(\"Liftoff!\");\n" +
            "    }\n" +
            "}");

        // 4B. LOOPS - ALTERNATIVE REMEDIAL TRACK
        upsertLesson(lessons, loops.id, "ALTERNATIVE", "Class 2: Variable Watch Tracing, Off-by-One Prevention & Loop Mastery",
            "Remedial Track: Mental models for iteration, index tracking tables, preventing infinite loops, and boundary testing.",
            "### 1. The Variable Watch Table Technique\n" +
            "When students struggle with loop logic on exams, the solution is NOT guessing — it is building a manual trace table on paper:\n" +
            "| Cycle # | Counter `i` | Condition `i < 4` | Body Output | Update `i++` |\n" +
            "|---|---|---|---|---|\n" +
            "| Init | 0 | true | prints 0 | `i` becomes 1 |\n" +
            "| 1 | 1 | true | prints 1 | `i` becomes 2 |\n" +
            "| 2 | 2 | true | prints 2 | `i` becomes 3 |\n" +
            "| 3 | 3 | true | prints 3 | `i` becomes 4 |\n" +
            "| Exit | 4 | false (loop ends) | (none) | terminated |\n\n" +
            "Notice how `for (int i = 0; i < 4; i++)` runs exactly 4 times (0, 1, 2, 3), and after the loop exits, `i` has the value 4!\n\n" +
            "### 2. The Fencepost Problem (Why Off-by-One Errors Happen)\n" +
            "Imagine building a fence 10 meters long with posts every 1 meter. How many posts do you need? You need **11 posts**, not 10! Because you need a post at meter 0 and meter 10.\n" +
            "- If you want to traverse an array of length 5: indices are `0, 1, 2, 3, 4`.\n" +
            "- If you write `i <= array.length`, you will crash on `i = 5`!\n" +
            "- Rule of thumb: With 0-based indices, use `i < length`. With 1-based counts, use `i <= count`.\n\n" +
            "### 3. While vs Do-While: The Bouncer vs the Hotel Check-in\n" +
            "- **`while` (The Strict Bouncer):** Checks your ID at the front door before you enter. If your ID is expired, you enter 0 times.\n" +
            "- **`do-while` (The Hotel Check-in):** Lets you step into the lobby first, and only checks your credit card before giving you room access. Guaranteed to execute the lobby step at least once!\n\n" +
            "### 4. `break` vs `continue`: Where Does Execution Jump?\n" +
            "- `break;`: Slams on the emergency brake and ejects you completely outside the loop.\n" +
            "- `continue;`: Skips the rest of this current round and fast-forwards directly to the next iteration step.",
            "public class LoopsAlternativeDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        String[] items = { \"A\", \"B\", \"C\" };\n" +
            "        for (int i = 0; i < items.length; i++) {\n" +
            "            System.out.println(\"Item at index \" + i + \" is \" + items[i]);\n" +
            "        }\n\n" +
            "        System.out.println(\"Skipping odd numbers with continue:\");\n" +
            "        for (int i = 1; i <= 6; i++) {\n" +
            "            if (i % 2 != 0) continue;\n" +
            "            System.out.print(i + \" \");\n" +
            "        }\n" +
            "        System.out.println();\n" +
            "    }\n" +
            "}");

        // 5A. ARRAYS - PRIMARY CORE TRACK
        upsertLesson(lessons, arrays.id, "PRIMARY", "Class 1: Arrays, Memory Layout & Sequence Operations",
            "Core Track: Contiguous indexed memory, zero-based indexing, bounds checking, and java.util.Arrays utilities.",
            "### 1. What is an Array in Memory?\n" +
            "An array is a fixed-size, indexed data structure that stores a collection of elements of the same type in contiguous memory locations in the heap.\n\n" +
            "### 2. Array Instantiation and Default Values\n" +
            "- `int[] numbers = new int[5];` allocates memory for 5 integers initialized to `0`.\n" +
            "- `String[] names = new String[3];` allocates memory for 3 object references initialized to `null`.\n" +
            "- Array initializer syntax: `int[] primes = { 2, 3, 5, 7, 11 };`\n\n" +
            "### 3. Zero-Based Indexing & Bounds Checking\n" +
            "- Elements are accessed via their zero-based index: `numbers[0]` is the first element.\n" +
            "- The last valid index is always `array.length - 1`.\n" +
            "- **`array.length`:** An immutable public field (not a method call, no parentheses).\n" +
            "- **`ArrayIndexOutOfBoundsException`:** Thrown at runtime if you attempt to access an index `< 0` or `>= array.length`.\n\n" +
            "### 4. Multi-Dimensional Arrays & java.util.Arrays\n" +
            "- 2D arrays are implemented as 'arrays of arrays': `int[][] grid = new int[3][3];`\n" +
            "- `Arrays.sort(arr)`: Sorts elements in ascending order.\n" +
            "- `Arrays.toString(arr)`: Returns a clean printable string `[1, 2, 3]`.",
            "import java.util.Arrays;\n\n" +
            "public class ArraysDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        int[] scores = { 88, 72, 95, 64, 91 };\n" +
            "        System.out.println(\"Original Scores: \" + Arrays.toString(scores));\n\n" +
            "        int min = scores[0];\n" +
            "        int max = scores[0];\n" +
            "        int total = 0;\n" +
            "        for (int s : scores) {\n" +
            "            if (s < min) min = s;\n" +
            "            if (s > max) max = s;\n" +
            "            total += s;\n" +
            "        }\n" +
            "        double avg = (double) total / scores.length;\n" +
            "        System.out.println(\"Min: \" + min + \" | Max: \" + max + \" | Avg: \" + avg);\n\n" +
            "        Arrays.sort(scores);\n" +
            "        System.out.println(\"Sorted Scores: \" + Arrays.toString(scores));\n" +
            "    }\n" +
            "}");

        // 5B. ARRAYS - ALTERNATIVE REMEDIAL TRACK
        upsertLesson(lessons, arrays.id, "ALTERNATIVE", "Class 2: Apartment Locker Models, Bounds Protection & Safe Manipulation",
            "Remedial Track: Locker row analogies, zero-index offset calculations, multidimensional traversal, and boundary guardrails.",
            "### 1. Intuitive Model: The Row of Mailbox Lockers\n" +
            "Picture a row of lockers in an apartment lobby:\n" +
            "- The first locker is locker #0 because it is **zero meters** away from the entrance lobby.\n" +
            "- Locker #1 is one step away.\n" +
            "- Locker #4 is four steps away.\n" +
            "- If there are 5 lockers total, their numbers are `0, 1, 2, 3, 4`. Locker #5 does NOT exist!\n" +
            "This is why Java uses zero-based indexing: the index is simply the **memory byte offset** from the beginning of the array.\n\n" +
            "### 2. Preventing the Fatal `ArrayIndexOutOfBoundsException`\n" +
            "This is the #1 runtime exception students trigger on array questions. Follow this ironclad guard rule:\n" +
            "Before accessing `array[i]`, ensure:\n" +
            "`if (i >= 0 && i < array.length)`\n" +
            "- Notice the `<` strictly less than `array.length`.\n" +
            "- Never write `i <= array.length` when accessing elements!\n\n" +
            "### 3. Array Length: Field vs Method Confusion\n" +
            "Students frequently confuse how length is checked across Java types:\n" +
            "- **Array:** `array.length` (Public variable/property — NO parentheses).\n" +
            "- **String:** `string.length()` (Method call — WITH parentheses).\n" +
            "- **ArrayList / Collections:** `list.size()` (Method call).\n\n" +
            "### 4. The Array Reference Sharing Trap\n" +
            "When you pass an array into a method or assign it to another variable: `int[] b = a;`, you are NOT making a copy of the numbers! Both variables point to the exact same lockers. Modifying `b[0] = 99` silently changes `a[0]` as well! To make an independent copy, use `Arrays.copyOf(a, a.length)`.",
            "import java.util.Arrays;\n\n" +
            "public class ArraysAlternativeDemo {\n" +
            "    public static void main(String[] args) {\n" +
            "        int[] lockers = { 101, 102, 103, 104 };\n" +
            "        int targetIndex = 4;\n" +
            "        if (targetIndex >= 0 && targetIndex < lockers.length) {\n" +
            "            System.out.println(\"Locker: \" + lockers[targetIndex]);\n" +
            "        } else {\n" +
            "            System.out.println(\"Safely guarded! Index \" + targetIndex + \" is out of bounds for size \" + lockers.length);\n" +
            "        }\n\n" +
            "        int[] original = { 1, 2, 3 };\n" +
            "        int[] trueCopy = Arrays.copyOf(original, original.length);\n" +
            "        trueCopy[0] = 999;\n" +
            "        System.out.println(\"Original intact: \" + original[0] + \" | Copy modified: \" + trueCopy[0]);\n" +
            "    }\n" +
            "}");

        // Expand question bank to 16 questions per concept (80 questions total)
        if (questions.count() < 80) {
            questions.deleteAll();
            questions.saveAll(List.of(
                // CONCEPT 1: VARIABLES (16 questions)
                q(variables.id, "Which primitive data type consumes 64 bits of memory and represents high-precision decimal values in Java?",
                  "float", "double", "long", "BigDecimal", "B",
                  "In Java, 'double' is a 64-bit IEEE 754 floating-point type, whereas 'float' is 32-bit."),
                q(variables.id, "What happens if you attempt to read a local variable inside a method before assigning a value to it?",
                  "It prints 0 by default", "It prints null", "Compile-time error: variable might not have been initialized", "It prints a random garbage value", "C",
                  "Local variables in Java are NOT assigned default values and must be initialized before access."),
                q(variables.id, "Which of the following is an INVALID variable identifier in Java?",
                  "_studentCount", "$totalAmount", "2ndAttempt", "total_score", "C",
                  "Java identifiers cannot begin with a numeric digit."),
                q(variables.id, "What occurs during explicit narrowing casting from double to int: (int) 9.85?",
                  "It rounds up to 10", "It truncates the decimal portion to 9", "It throws a ClassCastException", "It causes a compiler warning only", "B",
                  "Casting from a floating-point type to an integer truncates the fractional portion towards zero."),
                q(variables.id, "What is the effect of declaring a variable with the 'final' keyword in Java?",
                  "It can only be accessed within its class", "Its value cannot be reassigned once initialized", "It is stored in static heap memory", "It cannot be passed to methods", "B",
                  "The 'final' modifier makes a variable an immutable constant that cannot be reassigned."),
                q(variables.id, "Which data type is best suited for storing a true or false flag in Java?",
                  "int", "char", "boolean", "bit", "C",
                  "Java provides the 'boolean' primitive type specifically for true/false flags."),
                q(variables.id, "What is the default value of an uninitialized instance field of type String in a class?",
                  "Empty string \"\"", "\"null\"", "null", "undefined", "C",
                  "Reference types (including String) default to 'null' when declared as object fields."),
                q(variables.id, "Which statement correctly declares a constant named MAX_USERS with value 100?",
                  "constant int MAX_USERS = 100;", "final int MAX_USERS = 100;", "immutable int MAX_USERS = 100;", "static const MAX_USERS = 100;", "B",
                  "Java uses the 'final' keyword to define constants."),
                q(variables.id, "Which of the following is NOT a primitive data type in Java?",
                  "boolean", "String", "double", "byte", "B",
                  "String is a reference class type in java.lang, not a primitive."),
                q(variables.id, "What is the size and range of the Java 'byte' data type?",
                  "8 bits, -128 to 127", "16 bits, -32768 to 32767", "8 bits, 0 to 255", "32 bits, -2^31 to 2^31-1", "A",
                  "In Java, 'byte' is a signed 8-bit integer with range -128 to 127."),
                q(variables.id, "What is the result of assigning long val = 5000000000; without an 'L' suffix?",
                  "Compiles normally", "Automatic promotion to double", "Compilation error: integer number too large", "Wraps around to negative", "C",
                  "Integer literals default to 32-bit int in Java and require an 'L' suffix if exceeding int range."),
                q(variables.id, "Where are primitive local variables stored during method execution?",
                  "In the Eden space heap", "On the JVM call stack frame", "In Metaspace", "In the PermGen", "B",
                  "Local variables inside method scopes are allocated directly on that thread's call stack."),
                q(variables.id, "What is the default value of an uninitialized instance boolean field in a class?",
                  "null", "0", "false", "true", "C",
                  "Instance boolean fields default to false when an object is instantiated."),
                q(variables.id, "What happens when you declare a local variable using 'var' (introduced in Java 10)?",
                  "It becomes dynamically typed", "The compiler infers the static type from the initializer", "It can hold any type at runtime", "It is automatically final", "B",
                  "Java is still statically typed; 'var' allows the compiler to infer the static type."),
                q(variables.id, "Which syntax correctly initializes a char variable in Java?",
                  "char c = \"A\";", "char c = 'A';", "char c = [A];", "char c = `A`;", "B",
                  "Single characters in Java must be enclosed in single quotes ('A')."),
                q(variables.id, "Which numeric type conversion is handled implicitly by Java without explicit casting?",
                  "double to float", "int to byte", "int to double", "short to byte", "C",
                  "Widening conversion (such as 32-bit int to 64-bit double) is performed implicitly without data loss."),

                // CONCEPT 2: OPERATORS (16 questions)
                q(operators.id, "What is the result of the integer division expression 9 / 2 in Java?",
                  "4.5", "4", "5", "4.0", "B",
                  "Integer division in Java truncates the remainder, resulting in 4."),
                q(operators.id, "What does the modulus expression 19 % 4 evaluate to?",
                  "4", "3", "4.75", "1", "B",
                  "19 divided by 4 is 4 with a remainder of 3."),
                q(operators.id, "If int x = 5; int y = x++; what are the values of x and y after execution?",
                  "x = 5, y = 5", "x = 6, y = 5", "x = 6, y = 6", "x = 5, y = 6", "B",
                  "Postfix 'x++' assigns the original value (5) to y, then increments x to 6."),
                q(operators.id, "What is the result of the expression 10 + 2 * 5 - 3?",
                  "57", "17", "30", "14", "B",
                  "Multiplication takes precedence: 2 * 5 = 10; then left-to-right addition/subtraction: 10 + 10 - 3 = 17."),
                q(operators.id, "In Java short-circuit evaluation, when is the right-hand operand of A && B evaluated?",
                  "Always", "Only when A is true", "Only when A is false", "In parallel threads", "B",
                  "With '&&', if the left operand A is false, the entire expression is already false, so B is skipped."),
                q(operators.id, "Which operator is used to check if two primitive numbers are NOT equal in Java?",
                  "<>", "!=", "!==", "NOT", "B",
                  "Java uses '!=' as the inequality relational operator."),
                q(operators.id, "If boolean a = false; boolean b = true; what does !a || b evaluate to?",
                  "false", "true", "null", "Compilation error", "B",
                  "!a evaluates to true, and true || true evaluates to true."),
                q(operators.id, "What does the compound assignment operator x += 4 do?",
                  "Checks if x equals 4", "Assigns 4 to x", "Adds 4 to the current value of x and stores the result in x", "Increments x by 1 four times", "C",
                  "'x += 4' is shorthand for 'x = x + 4'."),
                q(operators.id, "What is the difference between '&' and '&&' when operating on boolean values?",
                  "There is no difference", "'&' always evaluates both operands, while '&&' short-circuits", "'&' is logical OR, '&&' is AND", "'&&' is bitwise only", "B",
                  "'&' on booleans does not short-circuit; '&&' short-circuits if the first operand is false."),
                q(operators.id, "What is the value of result after: int a = 4; int result = ++a * 2;?",
                  "8", "10", "9", "12", "B",
                  "Prefix '++a' increments a to 5 first; then 5 * 2 = 10."),
                q(operators.id, "Which operator performs bitwise XOR in Java?",
                  "|", "&", "^", "~", "C",
                  "The caret '^' operator represents bitwise XOR."),
                q(operators.id, "What does the expression 15 % -4 evaluate to in Java?",
                  "-3", "3", "-1", "3.75", "B",
                  "In Java, the sign of the modulus remainder matches the sign of the left dividend (15 % -4 = 3)."),
                q(operators.id, "What does the expression (10 > 5) ? (20 < 15 ? 1 : 2) : 3 evaluate to?",
                  "1", "2", "3", "Compilation error", "B",
                  "10 > 5 is true; 20 < 15 is false, so 2 is returned."),
                q(operators.id, "What is the result of the signed right shift expression 8 >> 1 in Java?",
                  "16", "4", "7", "64", "B",
                  "Signed right shift divides by 2: 8 >> 1 = 4."),
                q(operators.id, "What is printed by: System.out.println(\"Java\" + 10 + 20);?",
                  "Java30", "Java1020", "Compilation error", "Java10+20", "B",
                  "Left-to-right evaluation converts 10 to string first ('Java10'), then adds 20 ('Java1020')."),
                q(operators.id, "Which operator has the lowest precedence in Java?",
                  "* (Multiplication)", "== (Equality)", "&& (Logical AND)", "= (Assignment)", "D",
                  "Assignment operators have the lowest precedence among standard operators."),

                // CONCEPT 3: CONDITIONS (16 questions)
                q(conditions.id, "Which keyword provides the default fallback branch in an if-else-if ladder?",
                  "default", "otherwise", "else", "fallback", "C",
                  "The 'else' block executes when none of the preceding if or else-if conditions match."),
                q(conditions.id, "What is the primary advantage of modern arrow switch syntax (case 'A' ->) over traditional switch?",
                  "It executes in CPU cache", "It prevents accidental case fall-through without needing break statements", "It only accepts integers", "It allows duplicate case labels", "B",
                  "Arrow syntax (->) in switch statements/expressions automatically prevents fall-through into next cases."),
                q(conditions.id, "If int temp = 25; boolean sunny = true; what is printed by if (temp > 20 && sunny) print \"Beach\"; else print \"Stay\";?",
                  "Beach", "Stay", "BeachStay", "Nothing", "A",
                  "Both conditions (25 > 20 and sunny) are true, so the 'Beach' branch executes."),
                q(conditions.id, "What is a 'Guard Clause' in structured programming?",
                  "A firewall utility in Java network API", "An early validation check that exits or returns early to avoid deep nesting", "A condition inside a finally block", "A loop termination flag", "B",
                  "Guard clauses check preconditions at the top of a method and return early if invalid."),
                q(conditions.id, "Which data types are valid control expressions in a Java switch statement?",
                  "float and double only", "boolean and double", "byte, short, char, int, String, and enums", "Any floating point types", "C",
                  "Java switch supports whole number primitives (byte, short, char, int), String, and enums, but not float/double."),
                q(conditions.id, "What is the result of the ternary expression: score >= 50 ? \"Pass\" : \"Fail\" when score is 50?",
                  "\"Pass\"", "\"Fail\"", "null", "50", "A",
                  "50 >= 50 evaluates to true, so the first expression (\"Pass\") is returned."),
                q(conditions.id, "What happens in a traditional switch block if a matching case lacks a 'break;' statement?",
                  "Compilation error", "The switch immediately terminates", "Execution falls through into subsequent case statements", "JVM throws an exception", "C",
                  "Without 'break;', execution continues into the next case statements regardless of their labels (fall-through)."),
                q(conditions.id, "Why should String contents be compared using .equals() instead of ==?",
                  "'==' does not compile with Strings", "'==' checks reference memory identity while .equals() checks character content", ".equals() ignores case automatically", "'==' converts strings to numbers", "B",
                  "'==' compares object memory references; '.equals()' compares the actual characters."),
                q(conditions.id, "Can a switch statement in Java evaluate a String object?",
                  "No, only numeric primitives", "Yes, strings have been supported in switch since Java 7", "Only if string length is under 10", "Only using regex", "B",
                  "Java 7 introduced String evaluation support in switch statements."),
                q(conditions.id, "In modern Java switch expressions, what keyword returns a value from a multi-line code block?",
                  "return", "yield", "output", "send", "B",
                  "The 'yield' keyword returns a value from a block within a switch expression."),
                q(conditions.id, "What happens if an if statement has no curly braces and multiple statements follow?",
                  "Compile error", "Only the immediate first statement belongs to the if block", "All subsequent statements execute conditionally", "The block is ignored", "B",
                  "Without curly braces, only the single statement immediately following the condition is governed by the if."),
                q(conditions.id, "By De Morgan's Laws, what expression is equivalent to !(A && B)?",
                  "!A && !B", "!A || !B", "A || B", "!A && B", "B",
                  "De Morgan's Laws state that NOT (A AND B) equals (NOT A) OR (NOT B)."),
                q(conditions.id, "What is the value of msg: int code = 404; String msg = (code == 200) ? \"OK\" : (code == 404) ? \"Not Found\" : \"Unknown\";?",
                  "\"OK\"", "\"Not Found\"", "\"Unknown\"", "null", "B",
                  "The first condition is false, and the second condition (code == 404) is true, yielding 'Not Found'."),
                q(conditions.id, "Why should double and float values avoid exact equality checks (d == 1.0) in conditions?",
                  "They don't support ==", "Binary floating point representation causes minor rounding inaccuracies", "They cause arithmetic overflow", "They convert to integers", "B",
                  "Binary floating-point arithmetic introduces tiny precision offsets (e.g. 0.1 + 0.2 != 0.3), requiring epsilon threshold checks."),
                q(conditions.id, "What causes an 'unreachable code' compiler error in Java conditions?",
                  "An offline network connection", "Statements placed after an unconditional return or break that cannot ever execute", "Package private access", "Null pointer references", "B",
                  "The compiler flags statements following unconditional exits that can never be reached."),
                q(conditions.id, "What does 'case 1, 2, 3 ->' represent in enhanced switch syntax?",
                  "Array matching", "Multiple comma-separated case labels sharing the same branch", "Spawning three worker threads", "Syntax error", "B",
                  "Enhanced switch syntax allows comma-separated case labels to share a concise arrow branch."),

                // CONCEPT 4: LOOPS (16 questions)
                q(loops.id, "Which loop construct is guaranteed to execute its body at least once?",
                  "for loop", "while loop", "do-while loop", "enhanced for loop", "C",
                  "A 'do-while' loop tests its condition after executing the body, guaranteeing at least one execution."),
                q(loops.id, "How many times does for (int i = 0; i < 4; i++) execute its loop body?",
                  "3 times", "4 times", "5 times", "Infinite times", "B",
                  "The loop executes for i = 0, 1, 2, and 3, which is exactly 4 iterations."),
                q(loops.id, "What is the effect of the 'continue;' statement inside a loop?",
                  "It terminates the loop permanently", "It restarts the loop from i = 0", "It skips the rest of the current iteration and advances to the next cycle", "It pauses execution", "C",
                  "'continue' immediately jumps to the loop's update step and next condition check."),
                q(loops.id, "What happens in int x = 1; while (x > 0) { x++; }?",
                  "The loop runs once and terminates", "Compile-time error", "It creates an infinite loop until integer overflow wraps to negative", "It automatically stops at 100", "C",
                  "Because x continuously increases, x > 0 remains true until integer overflow wraps around to Integer.MIN_VALUE."),
                q(loops.id, "What is the purpose of the 'break;' statement inside a loop?",
                  "It restarts the current iteration", "It immediately terminates the loop and jumps to the code following it", "It resets loop variables", "It triggers garbage collection", "B",
                  "'break' terminates the innermost enclosing loop immediately."),
                q(loops.id, "Which loop is cleanest for iterating through an array when you do not need the index numbers?",
                  "Traditional for loop", "Enhanced for-each loop", "do-while loop", "recursive while", "B",
                  "The enhanced for-each loop (for (Type item : collection)) provides clean, index-free traversal."),
                q(loops.id, "What is an 'off-by-one error' commonly associated with loops?",
                  "An arithmetic overflow", "Iterating one time too many or too few due to boundary comparisons", "Forgetting to import java.util", "Using float instead of int", "B",
                  "Off-by-one errors occur when loop boundary conditions (< vs <=) are incorrectly set."),
                q(loops.id, "In for (int i = 10; i > 0; i -= 2), how many iterations will occur?",
                  "10", "5", "4", "6", "B",
                  "The loop runs for i = 10, 8, 6, 4, and 2, which is 5 iterations."),
                q(loops.id, "What will happen in: for ( ; ; ) { System.out.println(\"Running\"); }?",
                  "Compilation error", "Runs exactly once", "Creates an intentional infinite loop", "Prints null", "C",
                  "'for ( ; ; )' creates an intentional infinite loop equivalent to 'while (true)'."),
                q(loops.id, "What is printed by: for (int i = 0; i < 5; i++) { if (i == 2) continue; System.out.print(i + \" \"); }?",
                  "0 1 2 3 4 ", "0 1 ", "0 1 3 4 ", "2 3 4 ", "C",
                  "When i == 2, continue skips printing and advances to i = 3, outputting '0 1 3 4 '."),
                q(loops.id, "What is a 'labeled break' in Java?",
                  "A break that logs a string", "A break statement that terminates a specific outer labeled loop from nested loops", "A break pausing thread execution", "Only available in switch", "B",
                  "Labeled breaks ('break outer;') allow exiting nested loops to a labeled outer statement."),
                q(loops.id, "Which statement about the enhanced for-each loop is TRUE?",
                  "You can resize the array during iteration", "It gives direct index counter access", "It avoids ArrayIndexOutOfBoundsException by abstracting indices", "It iterates backwards", "C",
                  "The enhanced for-each loop abstracts index pointers, preventing index out of bounds bugs."),
                q(loops.id, "What is the final value of count after: int count = 0; while (count < 10) { count += 3; }?",
                  "9", "10", "12", "11", "C",
                  "count reaches 0 -> 3 -> 6 -> 9 -> 12, then stops because 12 is not < 10."),
                q(loops.id, "In a do-while loop, what punctuation is strictly required after the while(condition) closing parenthesis?",
                  "Colon :", "Semicolon ;", "Period .", "No punctuation", "B",
                  "A do-while loop must conclude with a semicolon after the while(...) condition."),
                q(loops.id, "What occurs if a loop update step decrements when counting up (for (int i = 0; i < 10; i--))?",
                  "Compile error", "Infinite loop until integer underflow", "Terminates on iteration 1", "Throws LoopException", "B",
                  "i decrements negative, keeping i < 10 true until underflowing past Integer.MIN_VALUE."),
                q(loops.id, "What is the total number of iterations executed by: for (int i = 0; i < 3; i++) for (int j = 0; j < 4; j++) { }?",
                  "7", "12", "10", "6", "B",
                  "For each of the 3 outer loop passes, the inner loop executes 4 times: 3 * 4 = 12."),

                // CONCEPT 5: ARRAYS (16 questions)
                q(arrays.id, "In Java, what is the index of the first element in an array?",
                  "1", "0", "-1", "It depends on the declaration", "B",
                  "Java arrays are zero-indexed, so the first element is at index 0."),
                q(arrays.id, "For an array int[] data = new int[8];, what is the index of the last element?",
                  "8", "7", "9", "data.length()", "B",
                  "The last valid index in any array is always array.length - 1 (here: 8 - 1 = 7)."),
                q(arrays.id, "What happens if you execute int val = arr[arr.length]; on an array?",
                  "It returns 0", "It returns the last element", "It throws an ArrayIndexOutOfBoundsException at runtime", "It returns null", "C",
                  "Index arr.length is one past the end of the array, triggering an ArrayIndexOutOfBoundsException."),
                q(arrays.id, "How do you find the total number of elements in an array named items?",
                  "items.size()", "items.length", "items.length()", "items.count", "B",
                  "In Java, 'length' is a public immutable field on arrays, accessed without parentheses."),
                q(arrays.id, "Which utility method in java.util.Arrays sorts an array in ascending order?",
                  "Arrays.order(arr)", "Arrays.sort(arr)", "Arrays.arrange(arr)", "Arrays.quickSort(arr)", "B",
                  "java.util.Arrays.sort() sorts arrays using dual-pivot Quicksort."),
                q(arrays.id, "What is the default value of elements when instantiating boolean[] flags = new boolean[3];?",
                  "true", "false", "null", "0", "B",
                  "The elements of a newly allocated boolean array are initialized to false by default."),
                q(arrays.id, "What is a 2D array in Java fundamentally?",
                  "A single contiguous matrix in hardware", "An array of array references", "A linked table", "A mapped matrix object", "B",
                  "Java implements multidimensional arrays as arrays of array references (allowing jagged arrays)."),
                q(arrays.id, "Which method in java.util.Arrays returns a human-readable string representation of array elements?",
                  "Arrays.print(arr)", "Arrays.format(arr)", "Arrays.toString(arr)", "Arrays.dump(arr)", "C",
                  "Arrays.toString(arr) formats array elements as a readable string like [1, 2, 3]."),
                q(arrays.id, "Can the length of a standard Java array be resized after instantiation?",
                  "Yes, via arr.resize()", "No, array capacity is fixed in heap memory upon creation", "Yes, by adding past the end", "Yes, using arr.length = N", "B",
                  "Standard Java arrays are fixed-length; dynamic sizing requires collections like ArrayList."),
                q(arrays.id, "What is the default value of elements in a newly allocated int[] numbers = new int[5]; array?",
                  "null", "-1", "0", "Random garbage", "C",
                  "Numeric primitive arrays automatically initialize all elements to 0."),
                q(arrays.id, "What is the purpose of System.arraycopy(...) in Java?",
                  "Prints an array", "Copies a contiguous sub-sequence between arrays via fast JVM native memory copy", "Clones to call stack", "Sorts elements", "B",
                  "System.arraycopy() provides high-performance native memory copying of array segments."),
                q(arrays.id, "What is a 'jagged array' (ragged array) in Java?",
                  "Corrupted array", "A 2D array where sub-arrays have varying lengths", "An array sorted in reverse", "An array missing indices", "B",
                  "Because multidimensional arrays are arrays of references, each row array can have a distinct length."),
                q(arrays.id, "What is printed by: int[] a = {1, 2}; int[] b = {1, 2}; System.out.println(a.equals(b));?",
                  "true", "false", "Compile error", "1", "B",
                  "Array .equals() inherits from Object and checks memory reference equality (a == b). Use Arrays.equals(a, b) for content comparison."),
                q(arrays.id, "Which method in java.util.Arrays sets every element of an array to a specified value?",
                  "Arrays.populate(arr, val)", "Arrays.setAll(arr, val)", "Arrays.fill(arr, val)", "Arrays.assign(arr, val)", "C",
                  "Arrays.fill(arr, val) assigns the value to every index in the array."),
                q(arrays.id, "What prerequisite is required before invoking Arrays.binarySearch(arr, key)?",
                  "Array must be multidimensional", "Only positive numbers", "Array must be sorted in ascending order", "Length must be power of 2", "C",
                  "Binary search requires the elements to be sorted in ascending order for valid lookups."),
                q(arrays.id, "What happens when you pass an array reference to a method in Java?",
                  "A deep copy is created", "The array reference is passed by value, allowing modifications to the original array elements", "It becomes read-only", "Compile error", "B",
                  "Java passes object references by value; changes to elements in the method alter the underlying array.")
            ));
        }

        // Seed initial quiz sessions & mastery if empty, so visualizations look rich immediately
        if (quizSessions.count() == 0) {
            Student demo = students.findByEmail("student@learnpath.local").orElse(null);
            Student priya = students.findByEmail("priya@learnpath.local").orElse(null);
            Student rahul = students.findByEmail("rahul@learnpath.local").orElse(null);

            List<Question> qVar = questions.findByConceptId(variables.id);
            List<Question> qOp = questions.findByConceptId(operators.id);
            List<Question> qCond = questions.findByConceptId(conditions.id);

            if (demo != null && qVar.size() >= 4 && qOp.size() >= 4) {
                saveSessionWithAttempts(quizSessions, quizAttempts, demo.id, java.id, variables.id,
                        List.of(qVar.get(0), qVar.get(1)), List.of(qVar.get(2), qVar.get(3)), 1, 50.0, false);
                saveSessionWithAttempts(quizSessions, quizAttempts, demo.id, java.id, variables.id,
                        List.of(qVar.get(0), qVar.get(1), qVar.get(2), qVar.get(3)), List.of(), 2, 100.0, true);
                masteryService.recalculate(demo.id, variables.id);

                saveSessionWithAttempts(quizSessions, quizAttempts, demo.id, java.id, operators.id,
                        List.of(qOp.get(0), qOp.get(1), qOp.get(2)), List.of(qOp.get(3)), 1, 75.0, true);
                masteryService.recalculate(demo.id, operators.id);
            }

            if (priya != null && qVar.size() >= 4 && qOp.size() >= 4 && qCond.size() >= 4) {
                saveSessionWithAttempts(quizSessions, quizAttempts, priya.id, java.id, variables.id,
                        List.of(qVar.get(0), qVar.get(1), qVar.get(2), qVar.get(3)), List.of(), 1, 100.0, true);
                masteryService.recalculate(priya.id, variables.id);

                saveSessionWithAttempts(quizSessions, quizAttempts, priya.id, java.id, operators.id,
                        List.of(qOp.get(0), qOp.get(1), qOp.get(2), qOp.get(3)), List.of(), 1, 100.0, true);
                masteryService.recalculate(priya.id, operators.id);

                saveSessionWithAttempts(quizSessions, quizAttempts, priya.id, java.id, conditions.id,
                        List.of(qCond.get(0), qCond.get(1)), List.of(qCond.get(2), qCond.get(3)), 1, 50.0, false);
                saveSessionWithAttempts(quizSessions, quizAttempts, priya.id, java.id, conditions.id,
                        List.of(qCond.get(0), qCond.get(1), qCond.get(2), qCond.get(3)), List.of(), 2, 100.0, true);
                masteryService.recalculate(priya.id, conditions.id);
            }

            if (rahul != null && qVar.size() >= 4) {
                saveSessionWithAttempts(quizSessions, quizAttempts, rahul.id, java.id, variables.id,
                        List.of(qVar.get(0), qVar.get(1), qVar.get(2)), List.of(qVar.get(3)), 1, 75.0, true);
                saveSessionWithAttempts(quizSessions, quizAttempts, rahul.id, java.id, variables.id,
                        List.of(qVar.get(0), qVar.get(1), qVar.get(2), qVar.get(3)), List.of(), 2, 100.0, true);
                masteryService.recalculate(rahul.id, variables.id);
            }
        }
    }

    private void saveSessionWithAttempts(QuizSessionRepository sessionRepo, QuizAttemptRepository attemptRepo,
                                         Integer studentId, Integer subjectId, Integer conceptId,
                                         List<Question> correctQuestions, List<Question> wrongQuestions,
                                         int attemptNumber, double scorePercent, boolean passed) {
        int total = correctQuestions.size() + wrongQuestions.size();
        sessionRepo.save(new QuizSession(studentId, subjectId, conceptId, total, correctQuestions.size(), scorePercent, passed, attemptNumber));
        for (Question q : correctQuestions) {
            attemptRepo.save(new QuizAttempt(studentId, conceptId, q.id, q.correctOption, true));
        }
        for (Question q : wrongQuestions) {
            String wrongOpt = "A".equals(q.correctOption) ? "B" : "A";
            attemptRepo.save(new QuizAttempt(studentId, conceptId, q.id, wrongOpt, false));
        }
    }

    private Concept findOrSaveConcept(ConceptRepository repo, Integer subjectId, String name, String desc, int order) {
        return repo.findBySubjectIdOrderByDisplayOrderAsc(subjectId).stream()
                .filter(c -> c.name.equalsIgnoreCase(name)).findFirst()
                .orElseGet(() -> repo.saveAndFlush(new Concept(subjectId, name, desc, order)));
    }

    private void upsertLesson(LessonRepository repo, Integer conceptId, String classType, String title, String tagline, String content, String code) {
        Lesson lesson = repo.findByConceptIdAndClassType(conceptId, classType)
                .orElseGet(() -> new Lesson(conceptId, title, classType, tagline, content, code));
        lesson.title = title;
        lesson.classType = classType;
        lesson.tagline = tagline;
        lesson.content = content;
        lesson.exampleCode = code;
        repo.save(lesson);
    }

    private Question q(Integer conceptId, String text, String a, String b, String c, String d, String correct, String explanation) {
        return new Question(conceptId, text, a, b, c, d, correct, explanation);
    }
}

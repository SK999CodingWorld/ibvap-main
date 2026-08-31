r = int(input("Enter number of rows: "))
c = int(input("Enter number of columns: "))

print("\nEnter elements of Matrix A:")
A = []
for i in range(r):
    row = []
    for j in range(c):
        value = int(input(f"A[{i}][{j}] = "))
        row.append(value)
    A.append(row)

print("\nEnter elements of Matrix B:")
B = []
for i in range(r):
    row = []
    for j in range(c):
        value = int(input(f"B[{i}][{j}] = "))
        row.append(value)
    B.append(row)

print("\n--- Matrix Operations ---")
print("1. Matrix Addition")
print("2. Matrix Multiplication")
print("3. Scalar Multiplication")
print("4. Exit")

choice = int(input("Enter your choice: "))

match choice:
    case 1:
        result = []
        for i in range(r):
            row = []
            for j in range(c):
                row.append(A[i][j] + B[i][j])
            result.append(row)
        print("\nMatrix Addition:")
        for row in result:
            print(row)
            
    case 2:
        if r != c:
            print("For this program, use square matrices.")
        else:
            result = []
            for i in range(r):
                row = []
                for j in range(c):
                    sum_val = 0
                    for k in range(c):
                        sum_val += A[i][k] * B[k][j]
                    row.append(sum_val)
                result.append(row)
            print("\nMatrix Multiplication:")
            for row in result:
                print(row)
                
    case 3:
        scalar = int(input("Enter scalar value: "))
        result = []
        for i in range(r):
            row = []
            for j in range(c):
                row.append(A[i][j] * scalar)
            result.append(row)
        print("\nScalar Multiplication:")
        for row in result:
            print(row)
            
    case 4:
        print("Program ended.")
        
    case _:
        print("Invalid choice!")
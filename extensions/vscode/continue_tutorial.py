"""                    _________               _____ _____
Chat, Edit, and Autocomplete tutorial
"""

# ———————————————————— Chat [Ctrl/Ctrl + L]: Ask "what sorting algorithm is this?" ————————————————————

def sorting_algorithm(x):
    for i in range(len(x)):
        for j in range(len(x) - 1):
            if x[j] > x[j + 1]:
                x[j], x[j + 1] = x[j + 1], x[j]
    return x

# —————————————————— Edit [Ctrl/Ctrl + I]: Tell Continue to "make this more readable" —————————————————

def sorting_algorithm(x):
    for i in range(len(x)):
        for j in range(len(x) - 1):
            if x[j] > x[j + 1]:
                x[j], x[j + 1] = x[j + 1], x[j]
    return x

# ——————————————— Autocomplete [Tab]: Place cursor after `:` below and press [Enter] —————————————————

# Basic assertion for sorting_algorithm:


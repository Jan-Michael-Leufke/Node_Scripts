#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>


int main(int argc, char *argv[]) {
    printf("\nFrom C:\n\n");

    for (int i = 0; i < argc; i++) {
        printf("Argument %d: %s\n", i, argv[i]);
    }

    printf("Number of arguments: %d\n", argc);
    printf("User ID: %d\n", getuid());
    printf("Process ID: %d\n", getpid());
    printf("Parent Process ID: %d\n", getppid());
    printf("Environment Variable MODE: %s\n", getenv("MODE") ? getenv("MODE") : "Not Set");
}
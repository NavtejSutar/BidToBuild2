const fs = require('fs');
const path = require('path');

const pomPath = path.join(__dirname, '..', 'backend', 'pom.xml');
let pom = fs.readFileSync(pomPath, 'utf8');

const compilerPlugin = `
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>\${lombok.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>`;

pom = pom.replace('<plugins>', '<plugins>' + compilerPlugin);
fs.writeFileSync(pomPath, pom, 'utf8');
console.log('Added lombok annotationProcessorPaths to maven-compiler-plugin.');
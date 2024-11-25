import { resolve } from 'node:path'
import fs from 'node:fs'

const defaults = {
  entry: '/icons',
  iconDirs: resolve(process.cwd(), './src/assets/icons'),
}

export default function (options) {
  const config = { ...defaults, ...options }
  const { entry, iconDirs } = config

  return {
    name: 'icon-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith(entry)) return next()

        let fileNames = []
        try {
          const stat = fs.statSync(iconDirs)
          if (stat.isDirectory()) {
            fileNames = fs
              .readdirSync(iconDirs, { encoding: 'utf-8' })
              .filter(item => item.endsWith('.svg'))
          }
        } catch (e) {
          console.error('Failed to read icon directory:', e)
        }

        const contents = fileNames
          .map(item => {
            return `
            <li>
              <div class="icon">${fs.readFileSync(
                resolve(iconDirs, item)
              )}</div>
              <span class="name">${item.replace('.svg', '')}</span>
            </li>`
          })
          .join('')

        res.setHeader('Content-Type', 'text/html')
        res.end(`
          <html>
            <head>
              <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  list-style: none;
                  box-sizing: border-box;
                }
                body {
                  font-family: Inter, "-apple-system", BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "noto sans", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
                  padding: 20px;
                  background-color: #fff;
                }
                ul {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 11px;
                  padding: 0;
                }
                li {
                  color: #444;
                  width: 100px;
                  height: 100px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  border: 1px solid #eee;
                  padding: 10px;
                  border-radius: 6px;
                  background-color: #fff;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                  cursor: pointer;
                  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                li:hover {
                  transform: translateY(-5px);
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }
                svg {
                  width: 25px;
                  height: 25px;
                  fill: currentColor;
                  transition: fill 0.2s ease-in-out;
                }
                .icon {
                  color: rgb(96, 98, 102);
                  fill: currentColor;
                }
                .name {
                  font-size: 12px;
                  color: #666;
                  margin-top: 8px;
                  text-align: center;
                  word-wrap: break-word;
                }
                #search {
                  width: 100%;
                  padding: 10px;
                  margin-bottom: 20px;
                  font-size: 16px;
                  border: 1px solid #eee;
                  border-radius: 4px;
                }
                 #search:hover {
                 border-color: #2346FF;
                 border-width: 1px;
                }
               #search:focus {
                  border-color: #2346FF !important;
                  border-width: 1px;
                  outline: none;
               }
              </style>
            </head>
            <body>
              <input type="text" id="search" placeholder="Search icons...">
              <ul>${contents}</ul>
              <script>
                // 搜索框的输入事件，用于过滤图标
                document.getElementById('search').addEventListener('input', function () {
                  const searchTerm = this.value.toLowerCase();
                  document.querySelectorAll('li').forEach(item => {
                    const name = item.querySelector('.name').textContent.toLowerCase();
                    item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
                  });
                });

                // 点击图标时，复制图标名称到剪贴板
                document.querySelectorAll('li').forEach(item => {
                  item.addEventListener('click', () => {
                    const name = item.querySelector('.name').textContent;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      // 使用 Clipboard API 实现复制
                      navigator.clipboard.writeText(name).then(() => {
                        Swal.fire({
                          icon: 'success',
                          title: 'Copied!',
                          text: 'Icon name "' + name + '" has been copied to the clipboard.',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 1500
                        });
                      }).catch(err => {
                        console.error('Failed to copy: ', err);
                      });
                    } else {
                      // 旧版浏览器的兼容方案
                      const textArea = document.createElement('textarea');
                      textArea.value = name;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        Swal.fire({
                          icon: 'success',
                          title: 'Copied!',
                          text: 'Icon name "' + name + '" has been copied to the clipboard.',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 1500
                        });
                      } catch (err) {
                        console.error('Fallback: Failed to copy', err);
                      }
                      document.body.removeChild(textArea);
                    }
                  });
                });
              </script>
            </body>
          </html>
        `)
      })
    },
  }
}

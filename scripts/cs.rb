# concat C# files
source = File.expand_path '~/Downloads/WebViewSample/Assets/Whiteboard'
headers = []
contents = []
Dir.glob "#{source}/*.cs" do |file|
  text = open file, 'r:bom|utf-8', &:read
  i = text.index 'namespace'
  headers.concat text[...i].lines(chomp: true).reject &:empty?
  contents.push text[i..]
end
headers = headers.uniq.sort_by do |e|
  [e.match(/using (\w+)/)[1], e.length]
end
contents = contents.join.gsub /^}\s*namespace\s\S+\s*{/m, ''
open 'cs/Whiteboard.cs', 'w' do |f|
  f.puts headers, nil, contents
end

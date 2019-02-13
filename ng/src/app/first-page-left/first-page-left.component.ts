import { Component, OnInit } from '@angular/core';
import { EmbedVideoService } from 'ngx-embed-video';

@Component({
  selector: 'app-first-page-left',
  templateUrl: './first-page-left.component.html',
  styleUrls: ['./first-page-left.component.scss']
})
export class FirstPageLeftComponent implements OnInit {

  youtubeUrl = 'https://www.youtube.com/watch?v=fH5NS3FOSU4';
  youtubeId = 'fH5NS3FOSU4';

  constructor(private embedService: EmbedVideoService) {
    console.log(this.embedService.embed(this.youtubeUrl));
    console.log(this.embedService.embed_youtube(this.youtubeId));
  }
  ngOnInit() {
  }

}
